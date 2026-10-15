import { createNameLabelApi } from "./nameLabel";

export const effectKindApi = createNameLabelApi("/api/admin/effect-kinds", {
  removable: false,
});
