import { useTranslation } from "react-i18next";

export const useIssueLabels = () => {
  const { t } = useTranslation("issues");

  return {
    getCategoryLabel: (category) =>
      t(`categories.${category}`, { defaultValue: category }),
    getCategoryDescription: (category) =>
      t(`categoryDescriptions.${category}`, { defaultValue: "" }),
    getStatusLabel: (status) =>
      t(`statuses.${status}`, { defaultValue: status }),
    getPriorityLabel: (priority) =>
      t(`priorities.${priority}`, { defaultValue: priority }),
  };
};
