import { Request, Response } from 'express';
import Product from '../../models/product.model';
import AttributeProduct from '../../models/attribute-product.model';
import axios from 'axios';
import { getInfoAddress } from '../../helpers/location.helper';
import { pointConfig } from '../../configs/variable.config';
import { getApiShipping } from '../../configs/setting.config';

// Lấy các phương án vận chuyển từ GoShip cho địa chỉ người nhận (gọi dịch vụ bên ngoài, có thể lỗi/chậm)
const getShippingOptions = async (userAddress: any, cartDetail: any[]) => {
  // Tọa độ của người gửi
  const shopLocation = {
    lat: 10.8037448,
    lng: 106.6617749
  };

  const shopInfoAddress = await getInfoAddress(shopLocation.lat, shopLocation.lng);

  const userInfoAddress = await getInfoAddress(userAddress.latitude, userAddress.longitude);

  // Tính trọng lượng đơn hàng
  const totalWeight = cartDetail.reduce((total, item) => total + item.quantity * 500, 0); // mỗi 1 sản phẩm nặng 500gram

  const dataGoShip = {
    shipment: {
      address_from: {
        city: shopInfoAddress.city, // Lấy từ API: /cities
        district: shopInfoAddress.district, // Lấy từ API: /districs
        ward: shopInfoAddress.ward // Lấy từ API: /wards
      },
      address_to: {
        city: userInfoAddress.city,
        district: userInfoAddress.district,
        ward: userInfoAddress.ward
      },
      parcel: {
        cod: "0", // Tiền thu hộ
        amout: "0", // Giá trị khai giá
        weight: totalWeight,
        width: "10",
        height: "10",
        length: "10"
      }
    }
  };

  const apiShipping = await getApiShipping();

  const goshipRes = await axios.post("https://sandbox.goship.io/api/v2/rates", dataGoShip, {
    headers: {
      Authorization: `Bearer ${apiShipping.tokenGoShip}`,
      "Content-Type": "application/json"
    },
    timeout: 10000
  });

  return goshipRes.data.data;
};

export const list = async (req: Request, res: Response) => {
  try {
    const { cart, userAddress } = req.body;

    // Lấy chi tiết sản phẩm
    const cartDetail: any[] = [];

    for (const item of cart) {
      const productDetail = await Product.findOne({
        _id: item.productId,
        deleted: false,
        status: "active"
      })

      if(productDetail) {
        const attributeList = await AttributeProduct
          .find({
            _id: { $in: productDetail.attributes }
          })
          .select("id name")
          .lean();

        const itemDetail = {
          ...item,
          detail: {
            images: productDetail.images,
            slug: productDetail.slug,
            name: productDetail.name,
            priceNew: productDetail.priceNew,
            priceOld: productDetail.priceOld,
            stock: productDetail.stock,
            attributeList: attributeList,
            variants: productDetail.variants
          }
        };

        cartDetail.push(itemDetail);
      }
    }
    // Hết Lấy chi tiết sản phẩm

    // Tính phí ship (gọi dịch vụ bên ngoài: lỗi ở đây không được làm hỏng cả giỏ hàng)
    let shippingOptions = null;
    let shippingError = "";
    if(userAddress) {
      try {
        shippingOptions = await getShippingOptions(userAddress, cartDetail);
      } catch (error: any) {
        console.error("Lỗi tính phí vận chuyển:", error?.response?.status || "", error?.message);
        shippingError = "Không lấy được phí vận chuyển cho địa chỉ này, vui lòng thử lại hoặc chọn địa chỉ khác!";
      }
    }
    // Hết Tính phí ship

    // Trả thêm điểm của người dùng
    const point = {
      canUsePoint: 0,
      POINT_TO_MONEY: pointConfig.POINT_TO_MONEY
    };
    if(res.locals.accountUser) {
      point.canUsePoint = res.locals.accountUser.totalPoint - res.locals.accountUser.usedPoint;
    }
    // Hết Trả thêm điểm của người dùng

    res.json({
      code: "success",
      message: "Thành công!",
      cart: cartDetail,
      shippingOptions: shippingOptions,
      shippingError: shippingError,
      point: point
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!"
    })
  }
}

export const cart = async (req: Request, res: Response) => {
  res.render("client/pages/cart", {
    pageTitle: "Giỏ hàng"
  });
}