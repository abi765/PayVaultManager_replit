import EmployeeFormModal from "../EmployeeFormModal";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function EmployeeFormModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)} data-testid="button-open-form">
        Open Employee Form
      </Button>
      <EmployeeFormModal
        open={open}
        onOpenChange={setOpen}
        onSave={(data) => {
          console.log("Saved:", data);
          setOpen(false);
        }}
      />
    </div>
  );
}
