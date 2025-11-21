import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users } from "lucide-react";
import { Employee, Department } from "@shared/schema";
import { formatPKR } from "@/lib/utils";

interface DepartmentNode extends Department {
  employees: Employee[];
  children: DepartmentNode[];
}

// Color mapping for each department
const getDepartmentColors = (name: string) => {
  const colorMap: Record<string, { border: string; text: string; bg: string; avatar: string }> = {
    "Executives": {
      border: "border-blue-500",
      text: "text-blue-600",
      bg: "bg-blue-500/10",
      avatar: "bg-blue-500/20 text-blue-600"
    },
    "Directors": {
      border: "border-indigo-500",
      text: "text-indigo-600",
      bg: "bg-indigo-500/10",
      avatar: "bg-indigo-500/20 text-indigo-600"
    },
    "Finance": {
      border: "border-green-500",
      text: "text-green-600",
      bg: "bg-green-500/10",
      avatar: "bg-green-500/20 text-green-600"
    },
    "Managers": {
      border: "border-purple-500",
      text: "text-purple-600",
      bg: "bg-purple-500/10",
      avatar: "bg-purple-500/20 text-purple-600"
    },
    "HR": {
      border: "border-amber-500",
      text: "text-amber-600",
      bg: "bg-amber-500/10",
      avatar: "bg-amber-500/20 text-amber-600"
    },
    "Coders": {
      border: "border-cyan-500",
      text: "text-cyan-600",
      bg: "bg-cyan-500/10",
      avatar: "bg-cyan-500/20 text-cyan-600"
    }
  };

  return colorMap[name] || {
    border: "border-gray-500",
    text: "text-gray-600",
    bg: "bg-gray-500/10",
    avatar: "bg-gray-500/20 text-gray-600"
  };
};

export default function Organization() {
  const { data: departments = [], isLoading: loadingDepts } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: employeesData, isLoading: loadingEmployees } = useQuery<{ employees: Employee[]; total: number }>({
    queryKey: ["/api/employees"],
  });

  const employees = employeesData?.employees || [];

  // Build hierarchical tree structure
  const buildTree = (): DepartmentNode[] => {
    const deptMap = new Map<number, DepartmentNode>();

    // Initialize all departments with employees
    departments.forEach(dept => {
      deptMap.set(dept.id, {
        ...dept,
        employees: employees.filter(emp => emp.departmentId === dept.id),
        children: [],
      });
    });

    // Build parent-child relationships
    const roots: DepartmentNode[] = [];
    deptMap.forEach(node => {
      if (node.parentId && deptMap.has(node.parentId)) {
        deptMap.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const tree = buildTree();

  // Employees without a department
  const unassignedEmployees = employees.filter(emp => !emp.departmentId);

  if (loadingDepts || loadingEmployees) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Organization Structure</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const DepartmentCard = ({ node, level = 0 }: { node: DepartmentNode; level?: number }) => {
    const isRoot = level === 0;
    const hasChildren = node.children.length > 0;
    const colors = getDepartmentColors(node.name);

    return (
      <div className="flex flex-col items-center">
        {/* Connection line from parent */}
        {!isRoot && (
          <div className="w-0.5 h-8 bg-border" />
        )}

        {/* Department Card */}
        <Card className={`w-64 border-2 ${colors.border}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className={`h-5 w-5 ${colors.text}`} />
              <h3 className="font-semibold">{node.name}</h3>
            </div>
            {node.description && (
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{node.description}</p>
            )}
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {node.employees.length}
              </Badge>
              {node.employees.length > 0 && (
                <div className="flex -space-x-2">
                  {node.employees.slice(0, 3).map((emp) => (
                    <div
                      key={emp.id}
                      className={`h-6 w-6 rounded-full border-2 border-background flex items-center justify-center ${colors.avatar}`}
                      title={emp.fullName}
                    >
                      <span className="text-[8px] font-medium">
                        {emp.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  ))}
                  {node.employees.length > 3 && (
                    <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                      <span className="text-[8px] font-medium">+{node.employees.length - 3}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Employee list */}
            {node.employees.length > 0 && (
              <div className="mt-3 pt-3 border-t space-y-1.5">
                {node.employees.map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between text-xs">
                    <span className="truncate flex-1">{emp.fullName}</span>
                    <span className="text-muted-foreground ml-2">{formatPKR(emp.salary)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Children */}
        {hasChildren && (
          <div className="flex flex-col items-center w-full">
            {/* Vertical line down from parent */}
            <div className="w-0.5 h-6 bg-border" />

            {/* Horizontal connector bar */}
            {node.children.length > 1 && (
              <div className="w-full flex justify-center">
                <div className="h-0.5 bg-border" style={{
                  width: node.children.length === 2 ? '50%' : '75%',
                  maxWidth: '600px'
                }} />
              </div>
            )}

            {/* Children grid */}
            <div className={`grid ${
              node.children.length === 1 ? 'grid-cols-1' :
              node.children.length === 2 ? 'grid-cols-2' :
              'grid-cols-3'
            } gap-4`}>
              {node.children.map((child) => (
                <DepartmentCard key={child.id} node={child} level={level + 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organization Structure</h1>
        <p className="text-muted-foreground">Hierarchical view of departments and employees</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{departments.length}</p>
              <p className="text-xs text-muted-foreground">Departments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{employees.length}</p>
              <p className="text-xs text-muted-foreground">Total Employees</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{employees.filter(e => e.departmentId).length}</p>
              <p className="text-xs text-muted-foreground">Assigned</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Org Chart */}
      <Card className="overflow-x-auto">
        <CardContent className="p-6">
          <div className="flex flex-col items-center min-w-fit">
            {tree.length === 0 ? (
              <p className="text-muted-foreground py-8">No departments configured</p>
            ) : (
              tree.map((root) => (
                <DepartmentCard key={root.id} node={root} />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Unassigned Employees */}
      {unassignedEmployees.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-yellow-600" />
              <h3 className="font-semibold">Unassigned Employees</h3>
              <Badge variant="outline" className="text-yellow-600 border-yellow-600 ml-auto">
                {unassignedEmployees.length}
              </Badge>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {unassignedEmployees.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                  <span className="truncate">{emp.fullName}</span>
                  <Badge
                    variant="outline"
                    className={`text-xs ml-2 ${
                      emp.status === 'active' ? 'text-green-600 border-green-600' :
                      emp.status === 'on_leave' ? 'text-yellow-600 border-yellow-600' :
                      'text-gray-600 border-gray-600'
                    }`}
                  >
                    {emp.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
