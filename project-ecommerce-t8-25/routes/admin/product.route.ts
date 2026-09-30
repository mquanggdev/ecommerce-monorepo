
import { Router } from "express";
import * as productController from "../../controllers/admin/product.controller";
import multer from "multer";
import * as productValidate from "../../validates/admin/product.validate";

import { checkPermission } from "../../middlewares/admin/auth.middleware";
const router = Router();

const upload = multer();

router.get('/category', checkPermission("product-category"), productController.category);

router.get('/category/create', checkPermission("product-category-create"), productController.createCategory);

router.post(
  '/category/create', 
  checkPermission("product-category-create"), 
  upload.none(), 
  productValidate.createCategoryPost, 
  productController.createCategoryPost
);

router.get('/category/edit/:id', checkPermission("product-category-edit"), productController.editCategory);

router.patch(
  '/category/edit/:id', 
  checkPermission("product-category-edit"), 
  upload.none(), 
  productValidate.createCategoryPost, 
  productController.editCategoryPatch
);

router.patch('/category/delete/:id', checkPermission("product-category-delete"), productController.deleteCategoryPatch);

router.get('/create', checkPermission("product-create"), productController.create);

router.post(
  '/create', 
  checkPermission("product-create"), 
  upload.none(), 
  productValidate.createPost, 
  productController.createPost
);
router.get('/list', checkPermission("product-list"), productController.list);

router.get('/edit/:id', checkPermission("product-edit"), productController.edit);

router.patch(
  '/edit/:id', 
  checkPermission("product-edit"), 
  upload.none(), 
  productValidate.createPost, 
  productController.editPatch
);


router.patch('/delete/:id', checkPermission("product-delete"), productController.deletePatch);


router.get('/attribute', checkPermission("product-attribute"), productController.attribute);

router.get('/attribute/create', checkPermission("product-attribute-create"), productController.createAttribute);

router.post(
  '/attribute/create', 
  checkPermission("product-attribute-create"), 
  upload.none(), 
  productValidate.createAttributePost, 
  productController.createAttributePost
);

router.get('/attribute/edit/:id', checkPermission("product-attribute-edit"), productController.editAttribute);

router.patch(
  '/attribute/edit/:id', 
  checkPermission("product-attribute-edit"), 
  upload.none(), 
  productValidate.createAttributePost, 
  productController.editAttributePatch
);

router.patch('/attribute/delete/:id', checkPermission("product-attribute-delete"), productController.deleteAttributePatch);


router.get('/export/csv', checkPermission("product-export"), productController.exportCSV);

router.post(
  '/import/csv',
  checkPermission("product-import"),
  upload.single("file"), 
  productValidate.importCSVPost,
  productController.importCSVPost
);



router.get('/edit-seo/:id', checkPermission("product-edit"), productController.editSEO);

router.patch(
  '/edit-seo/:id', 
  checkPermission("product-edit"), 
  upload.none(), 
  productValidate.editSEOPatch,
  productController.editSEOPatch
);


export default router;