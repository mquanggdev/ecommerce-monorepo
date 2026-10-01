import Product from "../models/product.model";

// So khớp một biến thể với lựa chọn của khách: cùng số thuộc tính và mọi thuộc tính đều trùng attrId + value
const isSameVariant = (variantItem: any, selected: { attrId: string, value: string }[]): boolean => {
  const attributeValue: any[] = variantItem?.attributeValue || [];
  if(attributeValue.length === 0 || attributeValue.length !== selected.length) return false;
  return attributeValue.every((attr: any) => {
    const match = selected.find(item => `${item.attrId}` === `${attr.attrId}`);
    return !!match && `${match.value}` === `${attr.value}`;
  });
}

// Biến thể đang bật (admin lưu boolean; dữ liệu nhập từ CSV có thể là chuỗi)
const isActiveVariant = (variantItem: any): boolean => !!variantItem?.status && variantItem.status !== "false";

// Tìm vị trí biến thể khớp với lựa chọn của khách. Trả -1 nếu không khớp hoặc biến thể đã tắt.
export const findVariantIndex = (
  variants: any[],
  selected: { attrId: string, value: string }[],
  onlyActive: boolean = true
): number => {
  return (variants || []).findIndex((variantItem: any) => {
    if(onlyActive && !isActiveVariant(variantItem)) return false;
    return isSameVariant(variantItem, selected);
  });
}

// Kho chung của sản phẩm có biến thể = tổng kho các biến thể đang bật (dùng khi admin lưu sản phẩm)
export const totalVariantStock = (variants: any[]): number => {
  return (variants || [])
    .filter(isActiveVariant)
    .reduce((total: number, variantItem: any) => total + (Number(variantItem.stock) || 0), 0);
}

// Tính lại kho chung ngay trong DB sau khi kho biến thể thay đổi.
// Dùng update pipeline để đọc kho biến thể tại đúng thời điểm ghi: nhiều đơn cùng lúc vẫn ra kết quả đúng.
export const syncProductStock = async (productId: string): Promise<void> => {
  await Product.updateOne(
    { _id: productId, "variants.0": { $exists: true } },
    [{
      $set: {
        stock: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: "$variants",
                  as: "variant",
                  cond: { $in: ["$$variant.status", [true, "true"]] }
                }
              },
              as: "variant",
              in: { $ifNull: ["$$variant.stock", 0] }
            }
          }
        }
      }
    }],
    { updatePipeline: true }
  );
}

// Trừ kho nguyên tử bằng một lệnh update có điều kiện.
// variantIndex >= 0: trừ kho của biến thể; ngược lại trừ kho của sản phẩm.
// Trả true nếu trừ được, false nếu không đủ hàng.
export const decreaseStock = async (productId: string, quantity: number, variantIndex: number): Promise<boolean> => {
  const field = variantIndex >= 0 ? `variants.${variantIndex}.stock` : "stock";
  const result = await Product.updateOne(
    {
      _id: productId,
      deleted: false,
      status: "active",
      [field]: { $gte: quantity } // Chỉ khớp khi còn đủ hàng
    },
    {
      $inc: { [field]: -quantity }
    }
  );
  const isDecreased = result.modifiedCount === 1;

  // Trừ kho biến thể thì kho chung (hiển thị "Còn hàng", lọc còn hàng, gợi ý tìm kiếm) cũng phải giảm theo
  if(isDecreased && variantIndex >= 0) {
    await syncProductStock(productId);
  }
  return isDecreased;
}

// Cộng lại kho (dùng khi tạo đơn thất bại giữa chừng hoặc đơn bị hủy/trả).
export const increaseStock = async (productId: string, quantity: number, variantValue?: any[]): Promise<void> => {
  if(variantValue && variantValue.length > 0) {
    const productDetail: any = await Product.findOne({ _id: productId }).select("variants").lean();
    // Biến thể có thể đã bị tắt sau khi bán nên không lọc theo status
    const variantIndex = productDetail ? findVariantIndex(productDetail.variants, variantValue, false) : -1;
    if(variantIndex < 0) {
      console.log(`Không hoàn được kho: không tìm thấy biến thể của sản phẩm ${productId}`);
      return;
    }
    await Product.updateOne(
      { _id: productId },
      { $inc: { [`variants.${variantIndex}.stock`]: quantity } }
    );
    await syncProductStock(productId);
    return;
  }

  await Product.updateOne(
    { _id: productId },
    { $inc: { stock: quantity } }
  );
}
