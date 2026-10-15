import { createNameLabelApi } from "./nameLabel";

export const effectTriggerApi = createNameLabelApi(
  "/api/admin/effect-triggers",
  {
    removable: false,
  },
);
