// Equipment Management Component

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Edit,
  Trash2,
  Activity,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  BarChart3,
  Camera,
  FileText,
  Settings,
} from 'lucide-react';
import { usePredictiveMaintenance } from '@/hooks/usePredictiveMaintenance';
import { EquipmentData } from '@/types/predictiveMaintenance';

interface EquipmentManagementProps {
  propertyId: string;
  className?: string;
}

export const EquipmentManagement: React.FC<EquipmentManagementProps> = ({
  propertyId,
  className = '',
}) => {
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentData | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const { equipment, alerts, isLoading, updateEquipment, isUpdatingEquipment } =
    usePredictiveMaintenance({ propertyId });

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConditionScore = (condition: string) => {
    switch (condition) {
      case 'excellent':
        return 95;
      case 'good':
        return 80;
      case 'fair':
        return 60;
      case 'poor':
        return 40;
      case 'critical':
        return 20;
      default:
        return 50;
    }
  };

  const getEquipmentIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      hvac_system: '❄️',
      water_heater: '🔥',
      refrigerator: '🧊',
      washing_machine: '👕',
      dishwasher: '🍽️',
      air_conditioner: '❄️',
      generator: '⚡',
      elevator: '🛗',
      security_system: '🔒',
      plumbing_fixtures: '🚿',
      electrical_panel: '⚡',
      roof: '🏠',
      windows: '🪟',
      doors: '🚪',
    };
    return iconMap[type] || '🔧';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getEquipmentAge = (installationDate: string) => {
    const install = new Date(installationDate);
    const now = new Date();
    const ageYears = (now.getTime() - install.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return Math.floor(ageYears);
  };

  const getEquipmentAlerts = (equipmentId: string) => {
    return alerts.filter((alert) => alert.equipment_id === equipmentId);
  };

  const EquipmentCard: React.FC<{ equipment: EquipmentData }> = ({ equipment }) => {
    const equipmentAlerts = getEquipmentAlerts(equipment.id);
    const criticalAlerts = equipmentAlerts.filter((a) => a.priority === 'critical').length;
    const age = getEquipmentAge(equipment.installation_date);
    const conditionScore = getConditionScore(equipment.current_condition);

    return (
      <Card
        className="cursor-pointer transition-shadow hover:shadow-md"
        onClick={() => setSelectedEquipment(equipment)}
      >
        <CardContent className="p-6">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{getEquipmentIcon(equipment.equipment_type)}</div>
              <div>
                <h3 className="text-lg font-semibold">
                  {equipment.equipment_type.replace('_', ' ').toUpperCase()}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {equipment.brand} {equipment.model}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Badge className={getConditionColor(equipment.current_condition)}>
                {equipment.current_condition}
              </Badge>
              {criticalAlerts > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {criticalAlerts} critical
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Health Score</span>
                <span className="font-medium">{conditionScore}%</span>
              </div>
              <Progress value={conditionScore} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Age</p>
                <p className="font-medium">{age} years</p>
              </div>
              <div>
                <p className="text-muted-foreground">Usage</p>
                <p className="font-medium capitalize">{equipment.usage_intensity}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Service</p>
                <p className="font-medium">
                  {equipment.last_service_date ? formatDate(equipment.last_service_date) : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Alerts</p>
                <p className="font-medium">{equipmentAlerts.length}</p>
              </div>
            </div>

            {equipmentAlerts.length > 0 && (
              <div className="border-t pt-2">
                <p className="mb-1 text-xs text-muted-foreground">Recent Alert:</p>
                <p className="text-xs font-medium">{equipmentAlerts[0].title}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const EquipmentDetails: React.FC<{ equipment: EquipmentData }> = ({ equipment }) => {
    const equipmentAlerts = getEquipmentAlerts(equipment.id);
    const age = getEquipmentAge(equipment.installation_date);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">{getEquipmentIcon(equipment.equipment_type)}</div>
            <div>
              <h2 className="text-2xl font-bold">
                {equipment.equipment_type.replace('_', ' ').toUpperCase()}
              </h2>
              <p className="text-muted-foreground">
                {equipment.brand} {equipment.model}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                updateEquipment({
                  equipmentId: equipment.id,
                  condition: equipment.current_condition,
                  notes: 'Manual inspection performed',
                })
              }
              disabled={isUpdatingEquipment}
            >
              <Activity className="mr-2 h-4 w-4" />
              Update Status
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Equipment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Installation Date</Label>
                  <p className="font-medium">{formatDate(equipment.installation_date)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Age</Label>
                  <p className="font-medium">{age} years</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Expected Lifespan</Label>
                  <p className="font-medium">{equipment.expected_lifespan_years} years</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Usage Intensity</Label>
                  <p className="font-medium capitalize">{equipment.usage_intensity}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Current Condition</Label>
                  <Badge className={getConditionColor(equipment.current_condition)}>
                    {equipment.current_condition}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Last Service</Label>
                  <p className="font-medium">
                    {equipment.last_service_date
                      ? formatDate(equipment.last_service_date)
                      : 'Never serviced'}
                  </p>
                </div>
              </div>

              {equipment.warranty_expiry && (
                <div>
                  <Label className="text-sm text-muted-foreground">Warranty Expires</Label>
                  <p className="font-medium">{formatDate(equipment.warranty_expiry)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Health & Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>Health Score</span>
                  <span className="font-medium">
                    {getConditionScore(equipment.current_condition)}%
                  </span>
                </div>
                <Progress value={getConditionScore(equipment.current_condition)} className="h-3" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Active Alerts</Label>
                {equipmentAlerts.length > 0 ? (
                  <div className="space-y-2">
                    {equipmentAlerts.slice(0, 3).map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-center justify-between rounded bg-gray-50 p-2"
                      >
                        <div className="flex items-center space-x-2">
                          <AlertTriangle
                            className={`h-4 w-4 ${
                              alert.priority === 'critical'
                                ? 'text-red-600'
                                : alert.priority === 'high'
                                  ? 'text-orange-600'
                                  : alert.priority === 'medium'
                                    ? 'text-yellow-600'
                                    : 'text-green-600'
                            }`}
                          />
                          <span className="text-sm">{alert.title}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {alert.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">No active alerts</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Maintenance History</CardTitle>
          </CardHeader>
          <CardContent>
            {equipment.maintenance_history && equipment.maintenance_history.length > 0 ? (
              <div className="space-y-3">
                {equipment.maintenance_history.slice(0, 5).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`rounded-full p-2 ${
                          record.maintenance_type === 'emergency'
                            ? 'bg-red-100'
                            : record.maintenance_type === 'corrective'
                              ? 'bg-orange-100'
                              : record.maintenance_type === 'preventive'
                                ? 'bg-green-100'
                                : 'bg-blue-100'
                        }`}
                      >
                        <Wrench
                          className={`h-4 w-4 ${
                            record.maintenance_type === 'emergency'
                              ? 'text-red-600'
                              : record.maintenance_type === 'corrective'
                                ? 'text-orange-600'
                                : record.maintenance_type === 'preventive'
                                  ? 'text-green-600'
                                  : 'text-blue-600'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{record.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(record.performed_date)} • {record.performed_by}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">₦{record.cost.toLocaleString()}</p>
                      <Badge variant="outline" className="text-xs">
                        {record.maintenance_type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <FileText className="mx-auto mb-2 h-8 w-8" />
                <p>No maintenance history available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                  <div className="h-8 w-1/2 rounded bg-gray-200"></div>
                  <div className="h-2 w-full rounded bg-gray-200"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {selectedEquipment ? (
        <div>
          <Button variant="outline" onClick={() => setSelectedEquipment(null)} className="mb-4">
            ← Back to Equipment List
          </Button>
          <EquipmentDetails equipment={selectedEquipment} />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Equipment Management</h2>
              <p className="text-muted-foreground">Monitor and manage all property equipment</p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Equipment
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {equipment.map((item) => (
              <EquipmentCard key={item.id} equipment={item} />
            ))}
          </div>

          {equipment.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Settings className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No Equipment Found</h3>
                <p className="mb-4 text-muted-foreground">
                  Start by adding equipment to enable predictive maintenance features.
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Equipment
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Add Equipment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Equipment</DialogTitle>
            <DialogDescription>
              Add equipment to enable predictive maintenance monitoring
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="equipment-type">Equipment Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hvac_system">HVAC System</SelectItem>
                    <SelectItem value="water_heater">Water Heater</SelectItem>
                    <SelectItem value="refrigerator">Refrigerator</SelectItem>
                    <SelectItem value="washing_machine">Washing Machine</SelectItem>
                    <SelectItem value="dishwasher">Dishwasher</SelectItem>
                    <SelectItem value="air_conditioner">Air Conditioner</SelectItem>
                    <SelectItem value="generator">Generator</SelectItem>
                    <SelectItem value="elevator">Elevator</SelectItem>
                    <SelectItem value="security_system">Security System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" placeholder="Equipment brand" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="model">Model</Label>
                <Input id="model" placeholder="Equipment model" />
              </div>
              <div>
                <Label htmlFor="installation-date">Installation Date</Label>
                <Input id="installation-date" type="date" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="condition">Current Condition</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="usage">Usage Intensity</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select usage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAddDialogOpen(false)}>Add Equipment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EquipmentManagement;
