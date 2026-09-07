
import { Router } from "express";
import * as articleController from "../../controllers/admin/article.controller";
import multer from "multer";
import * as articleValidate from "../../validates/admin/article.validate";
import { checkPermission } from "../../middlewares/admin/auth.middleware";

const router = Router();

const upload = multer();

router.get('/category',checkPermission("article-category"), articleController.category);
router.get('/category/trash',checkPermission("article-category-trash"),articleController.trashCategory);

router.get('/category/create',checkPermission("article-category-create"), articleController.createCategory);

router.post(
  '/category/create', 
  upload.none(),
  checkPermission("article-category-create"), 
  articleValidate.createCategoryPost, 
  articleController.createCategoryPost
);


router.get('/category/edit/:id',checkPermission("article-category-edit"), articleController.editCategory);

router.patch(
  '/category/edit/:id', 
  upload.none(),
  checkPermission("article-category-edit"),
  articleValidate.createCategoryPost, 
  articleController.editCategoryPatch
);
router.patch('/category/delete/:id',checkPermission("article-category-delete"), articleController.deleteCategoryPatch);

router.patch('/category/undo/:id',checkPermission("article-category-trash"), articleController.undoCategoryPatch);

router.delete('/category/destroy/:id', checkPermission("article-category-trash"),articleController.destroyCategoryDelete);




router.get('/create',checkPermission("article-create"), articleController.create);

router.post(
  '/create', 
  upload.none(),
   checkPermission("article-create"),
  articleValidate.createPost, 
  articleController.createPost
);



router.get('/list',checkPermission("article-list"), articleController.list);

router.get('/edit/:id',checkPermission("article-edit"), articleController.edit);

router.patch(
  '/edit/:id', 
  upload.none(),
  checkPermission("article-edit"), 
  articleValidate.createPost, 
  articleController.editPatch
);

router.patch('/delete/:id',checkPermission("article-delete"), articleController.deletePatch);


export default router;