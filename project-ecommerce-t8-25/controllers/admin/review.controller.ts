import { Request, Response } from 'express';
import Review from '../../models/review.model';
import AccountUser from '../../models/account-user.model';
import Product from '../../models/product.model';

export const list = async (req: Request, res: Response) => {
  const find: {} = {};

  // Phân trang
  const limitItems = 20;
  let page = 1;
  if(req.query.page) {
    const currentPage = parseInt(`${req.query.page}`);
    if(currentPage > 0) {
      page = currentPage;
    }
  }
  const totalRecord = await Review.countDocuments(find);
  const totalPage = Math.ceil(totalRecord/limitItems);
  const skip = (page - 1) * limitItems;
  const pagination = {
    skip: skip,
    totalRecord: totalRecord,
    totalPage: totalPage
  };
  // Hết Phân trang
  
  const recordList: any = await Review
    .find(find)
    .limit(limitItems)
    .skip(skip)
    .sort({
      createdAt: "desc"
    });

  for (const item of recordList) {
    const userInfo = await AccountUser.findOne({
      _id: item.userId
    });
    if(userInfo) {
      item.user = {
        fullName: userInfo.fullName,
        email: userInfo.email,
        avatar: userInfo.avatar
      };
    }

    const productInfo = await Product.findOne({
      _id: item.productId
    });
    if(productInfo) {
      item.product = {
        name: productInfo.name,
        images: productInfo.images,
      };
    }
  }
  
  res.render("admin/pages/review-list", {
    pageTitle: "Quản lý đánh giá",
    recordList: recordList,
    pagination: pagination
  });
}

export const changeStatusPatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const status = req.params.status;

    if(!["approved", "rejected"].includes(`${status}`)) {
      res.json({
        code: "error",
        message: "Trạng thái không hợp lệ!"
      })
      return;
    }

    const review = await Review.findOneAndUpdate({
      _id: id
    }, {
      status: status
    });

    if(!review) {
      res.json({
        code: "error",
        message: "Đánh giá không tồn tại!"
      })
      return;
    }

    // Tính lại điểm của sản phẩm từ toàn bộ đánh giá ĐÃ DUYỆT (không cộng dồn, nên duyệt/từ chối nhiều lần vẫn đúng)
    const [ratingStat] = await Review.aggregate([
      {
        $match: {
          productId: review.productId,
          status: "approved"
        }
      },
      {
        $group: {
          _id: null,
          ratingAvg: { $avg: "$rating" },
          ratingCount: { $sum: 1 }
        }
      }
    ]);

    await Product.updateOne({
      _id: review.productId
    }, {
      ratingAvg: ratingStat ? Math.round(ratingStat.ratingAvg * 10) / 10 : 0,
      ratingCount: ratingStat ? ratingStat.ratingCount : 0
    });

    res.json({
      code: "success",
      message: "Cập nhật trạng thái thành công!"
    })
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Id không hợp lệ!"
    })
  }
}
