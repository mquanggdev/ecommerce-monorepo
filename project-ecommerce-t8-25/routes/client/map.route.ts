import { Router } from "express";
import * as mapController from "../../controllers/client/map.controller";
import { mapGeocodeLimiter, mapTileLimiter } from "../../middlewares/rate-limit.middleware";

const router = Router();

router.get('/tiles/:z/:x/:y.png', mapTileLimiter, mapController.tile);
router.get('/reverse', mapGeocodeLimiter, mapController.reverse);
router.get('/search', mapGeocodeLimiter, mapController.search);

export default router;
