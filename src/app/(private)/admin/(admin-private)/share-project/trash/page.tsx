import { ShareProjectPage } from "../_components/ShareProjectPage";

export default function ShareProjectTrashPage() {
  return (
    <ShareProjectPage
      title="Trash"
      description="Soft-deleted projects. Backend trash listing support is required before deleted rows can be displayed."
      trash
    />
  );
}
