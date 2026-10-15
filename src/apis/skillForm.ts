import { createNameLabelApi } from "./nameLabel";

export const skillFormApi = createNameLabelApi("/api/admin/skill-forms", {
  removable: false,
});
