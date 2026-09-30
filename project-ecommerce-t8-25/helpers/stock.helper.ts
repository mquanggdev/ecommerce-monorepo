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

// Tìm vị trí biến thể khớp với lựa chọn của khách. Trả -1 nếu không khớp hoặc biến thể đã tắt.
export const findVariantIndex = (
  variants: any[],
  selected: { attrId: string, value: string }[],
  onlyActive: boolean = true
): number => {
  return (variants || []).findIndex((variantItem: any) => {
    if(onlyActive && !variantItem?.status) return false;
    return isSameVariant(variantItem, selected);
  });
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
  return result.modifiedCount === 1;
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
    return;
  }

  await Product.updateOne(
    { _id: productId },
    { $inc: { stock: quantity } }
  );
}
