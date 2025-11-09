export const PAKISTANI_BANKS = [
  "Allied Bank Limited (ABL)",
  "Askari Bank",
  "Bank Alfalah",
  "Bank Al-Habib",
  "BankIslami Pakistan",
  "Dubai Islamic Bank",
  "Faysal Bank",
  "Habib Bank Limited (HBL)",
  "Habib Metropolitan Bank",
  "JS Bank",
  "MCB Bank Limited",
  "Meezan Bank",
  "National Bank of Pakistan (NBP)",
  "Samba Bank",
  "Silk Bank",
  "Soneri Bank",
  "Standard Chartered Bank Pakistan",
  "Summit Bank",
  "The Bank of Punjab",
  "United Bank Limited (UBL)",
  "Custom (Enter manually)",
] as const;

export const EMPLOYEE_STATUS = {
  active: { label: "Active", color: "bg-green-500" },
  on_leave: { label: "On Leave", color: "bg-yellow-500" },
  inactive: { label: "Inactive", color: "bg-gray-500" },
} as const;

export const PAYMENT_STATUS = {
  pending: { label: "Pending", color: "bg-yellow-500" },
  paid: { label: "Paid", color: "bg-green-500" },
  failed: { label: "Failed", color: "bg-red-500" },
} as const;
