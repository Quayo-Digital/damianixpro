import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Calculator,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Wrench,
  Zap,
  Home,
} from 'lucide-react';

interface PropertyAnalysis {
  rentRanges: {
    unitType: string;
    suggestedMin: number;
    suggestedMax: number;
    marketAverage: number;
  }[];
  depositRecommendations: {
    unitType: string;
    recommendedDeposit: number;
    percentage: number;
  }[];
  utilityBilling: {
    structure: string;
    recommendations: string[];
    estimatedMonthly: number;
  };
  maintenanceCosts: {
    monthlyEstimate: number;
    annualEstimate: number;
    perUnitMonthly: number;
    recommendations: string[];
  };
  missingData: string[];
}

interface UnitType {
  type: string;
  count: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
}

export function PropertyAnalyzer() {
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [totalUnits, setTotalUnits] = useState('');
  const [units, setUnits] = useState<UnitType[]>([]);
  const [buildingAge, setBuildingAge] = useState('');
  const [hasGenerator, setHasGenerator] = useState(false);
  const [hasBorehole, setHasBorehole] = useState(false);
  const [hasElevator, setHasElevator] = useState(false);
  const [hasSwimmingPool, setHasSwimmingPool] = useState(false);
  const [hasGym, setHasGym] = useState(false);
  const [analysis, setAnalysis] = useState<PropertyAnalysis | null>(null);

  const nigerianLocations = [
    'Lagos',
    'Abuja',
    'Port Harcourt',
    'Ibadan',
    'Kano',
    'Enugu',
    'Abeokuta',
    'Calabar',
    'Uyo',
    'Warri',
    'Asaba',
    'Owerri',
    'Kaduna',
    'Jos',
    'Benin City',
  ];

  const propertyTypes = [
    'Apartment Building',
    'Duplex Complex',
    'Terraced Houses',
    'Mixed-Use Building',
    'Commercial Complex',
  ];

  const unitTypes = ['Studio', '1 Bedroom', '2 Bedroom', '3 Bedroom', '4 Bedroom', '5+ Bedroom'];

  // Market data for Nigerian locations (rent is annual - standard in Nigeria)
  const locationMultipliers: Record<string, number> = {
    Lagos: 1.5, // Premium market
    Abuja: 1.4,
    'Port Harcourt': 1.2,
    Ibadan: 0.8,
    Kano: 0.7,
    Enugu: 0.75,
    Abeokuta: 0.7,
    Calabar: 0.8,
    Uyo: 0.75,
    Warri: 0.9,
    Asaba: 0.7,
    Owerri: 0.75,
    Kaduna: 0.8,
    Jos: 0.7,
    'Benin City': 0.7,
  };

  // Base rent ranges per unit type (in NGN per year - Nigeria standard)
  const baseRentRanges: Record<string, { min: number; max: number; avg: number }> = {
    Studio: { min: 2400000, max: 4800000, avg: 3600000 },
    '1 Bedroom': { min: 4200000, max: 8400000, avg: 6000000 },
    '2 Bedroom': { min: 7200000, max: 14400000, avg: 10200000 },
    '3 Bedroom': { min: 12000000, max: 24000000, avg: 16800000 },
    '4 Bedroom': { min: 21600000, max: 42000000, avg: 30000000 },
    '5+ Bedroom': { min: 36000000, max: 72000000, avg: 48000000 },
  };

  const addUnit = () => {
    setUnits([...units, { type: '', count: 1 }]);
  };

  const updateUnit = (index: number, field: keyof UnitType, value: any) => {
    const updated = [...units];
    updated[index] = { ...updated[index], [field]: value };
    setUnits(updated);
  };

  const removeUnit = (index: number) => {
    setUnits(units.filter((_, i) => i !== index));
  };

  const calculateAnalysis = (): PropertyAnalysis => {
    const missingData: string[] = [];
    const rentRanges: PropertyAnalysis['rentRanges'] = [];
    const depositRecommendations: PropertyAnalysis['depositRecommendations'] = [];

    // Check for missing data
    if (!location) missingData.push('Property location');
    if (!propertyType) missingData.push('Property type');
    if (units.length === 0) missingData.push('Unit types and counts');
    if (!buildingAge) missingData.push('Building age');

    if (missingData.length > 0 && !analysis) {
      return {
        rentRanges: [],
        depositRecommendations: [],
        utilityBilling: {
          structure: '',
          recommendations: [],
          estimatedMonthly: 0,
        },
        maintenanceCosts: {
          monthlyEstimate: 0,
          annualEstimate: 0,
          perUnitMonthly: 0,
          recommendations: [],
        },
        missingData,
      };
    }

    const locationMultiplier = locationMultipliers[location] || 1.0;
    const ageMultiplier = buildingAge
      ? parseInt(buildingAge) < 5
        ? 1.1
        : parseInt(buildingAge) < 10
          ? 1.0
          : 0.9
      : 1.0;
    const amenityMultiplier =
      (hasGenerator ? 1.05 : 1) *
      (hasBorehole ? 1.03 : 1) *
      (hasElevator ? 1.08 : 1) *
      (hasSwimmingPool ? 1.1 : 1) *
      (hasGym ? 1.05 : 1);

    // Calculate rent ranges for each unit type
    units.forEach((unit) => {
      if (!unit.type) return;

      const baseRange = baseRentRanges[unit.type];
      if (!baseRange) return;

      const adjustedMin = Math.round(
        baseRange.min * locationMultiplier * ageMultiplier * amenityMultiplier
      );
      const adjustedMax = Math.round(
        baseRange.max * locationMultiplier * ageMultiplier * amenityMultiplier
      );
      const adjustedAvg = Math.round(
        baseRange.avg * locationMultiplier * ageMultiplier * amenityMultiplier
      );

      rentRanges.push({
        unitType: unit.type,
        suggestedMin: adjustedMin,
        suggestedMax: adjustedMax,
        marketAverage: adjustedAvg,
      });

      // Deposit recommendations (typically 1-2 years rent)
      const depositAmount = Math.round(adjustedAvg * 12); // 1 year rent as deposit
      depositRecommendations.push({
        unitType: unit.type,
        recommendedDeposit: depositAmount,
        percentage: 100, // 100% of annual rent
      });
    });

    // Calculate total units
    const totalUnitCount = units.reduce((sum, unit) => sum + (unit.count || 1), 0);

    // Utility billing structure
    const utilityRecommendations: string[] = [];
    let estimatedMonthlyUtility = 0;

    if (hasGenerator) {
      utilityRecommendations.push('Generator maintenance: ₦50,000 - ₦100,000/month');
      estimatedMonthlyUtility += 75000;
    }
    if (hasBorehole) {
      utilityRecommendations.push('Borehole maintenance: ₦20,000 - ₦40,000/month');
      estimatedMonthlyUtility += 30000;
    }
    if (hasElevator) {
      utilityRecommendations.push('Elevator maintenance: ₦80,000 - ₦150,000/month');
      estimatedMonthlyUtility += 115000;
    }
    if (hasSwimmingPool) {
      utilityRecommendations.push('Pool maintenance: ₦60,000 - ₦120,000/month');
      estimatedMonthlyUtility += 90000;
    }
    if (hasGym) {
      utilityRecommendations.push('Gym equipment maintenance: ₦30,000 - ₦60,000/month');
      estimatedMonthlyUtility += 45000;
    }

    // Base utility costs per unit
    const baseUtilityPerUnit = 15000; // Water, waste, common area electricity
    estimatedMonthlyUtility += baseUtilityPerUnit * totalUnitCount;

    utilityRecommendations.push(
      `Common area utilities: ₦${(baseUtilityPerUnit * totalUnitCount).toLocaleString()}/month`
    );
    utilityRecommendations.push(
      'Consider: Separate metering for individual units vs. shared billing'
    );

    // Maintenance cost expectations
    const avgRentPerUnit =
      rentRanges.length > 0
        ? rentRanges.reduce((sum, r) => sum + r.marketAverage, 0) / rentRanges.length
        : 0;

    // Maintenance typically 5-10% of rental income (rent is annual in Nigeria)
    const maintenancePercentage = 0.075; // 7.5% average
    const totalAnnualRent = rentRanges.reduce((sum, r) => {
      const unit = units.find((u) => u.type === r.unitType);
      return sum + r.marketAverage * (unit?.count || 1);
    }, 0);
    const totalMonthlyRent = totalAnnualRent / 12;

    const monthlyMaintenance = Math.round(totalMonthlyRent * maintenancePercentage);
    const perUnitMonthly = totalUnitCount > 0 ? Math.round(monthlyMaintenance / totalUnitCount) : 0;

    const maintenanceRecommendations: string[] = [
      'Set aside 5-10% of annual rental income for maintenance',
      'Create a maintenance reserve fund (3-6 months of expenses)',
      'Regular inspections: Quarterly for all units',
      'Emergency fund: ₦500,000 - ₦2,000,000 depending on property size',
    ];

    if (parseInt(buildingAge || '0') > 10) {
      maintenanceRecommendations.push('⚠️ Older building: Budget 10-15% for maintenance');
    }

    return {
      rentRanges,
      depositRecommendations,
      utilityBilling: {
        structure:
          hasGenerator || hasBorehole || hasElevator
            ? 'Shared utilities with maintenance fees'
            : 'Individual metering recommended',
        recommendations: utilityRecommendations,
        estimatedMonthly: estimatedMonthlyUtility,
      },
      maintenanceCosts: {
        monthlyEstimate: monthlyMaintenance,
        annualEstimate: monthlyMaintenance * 12,
        perUnitMonthly,
        recommendations: maintenanceRecommendations,
      },
      missingData,
    };
  };

  const handleAnalyze = () => {
    const result = calculateAnalysis();
    setAnalysis(result);
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG')}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-500" />
            Property Financial Analyzer
          </CardTitle>
          <CardDescription>
            Get recommendations for rent, deposits, utilities, and maintenance for multi-unit
            properties
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Property Info */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="location">Location *</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {nigerianLocations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="propertyType">Property Type *</Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger id="propertyType">
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="buildingAge">Building Age (Years)</Label>
              <Input
                id="buildingAge"
                type="number"
                placeholder="e.g., 5"
                value={buildingAge}
                onChange={(e) => setBuildingAge(e.target.value)}
              />
            </div>
          </div>

          {/* Unit Types */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Unit Types & Counts *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addUnit}>
                <Home className="mr-2 h-4 w-4" />
                Add Unit Type
              </Button>
            </div>
            <div className="space-y-3">
              {units.map((unit, index) => (
                <div key={index} className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label>Unit Type</Label>
                    <Select
                      value={unit.type}
                      onValueChange={(value) => updateUnit(index, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit type" />
                      </SelectTrigger>
                      <SelectContent>
                        {unitTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32">
                    <Label>Count</Label>
                    <Input
                      type="number"
                      min="1"
                      value={unit.count || 1}
                      onChange={(e) => updateUnit(index, 'count', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeUnit(index)}>
                    Remove
                  </Button>
                </div>
              ))}
              {units.length === 0 && (
                <p className="text-sm text-gray-500">Click "Add Unit Type" to get started</p>
              )}
            </div>
          </div>

          {/* Amenities */}
          <div>
            <Label className="mb-2 block">Property Amenities</Label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {[
                {
                  key: 'generator',
                  label: 'Generator',
                  state: hasGenerator,
                  setter: setHasGenerator,
                },
                { key: 'borehole', label: 'Borehole', state: hasBorehole, setter: setHasBorehole },
                { key: 'elevator', label: 'Elevator', state: hasElevator, setter: setHasElevator },
                {
                  key: 'pool',
                  label: 'Swimming Pool',
                  state: hasSwimmingPool,
                  setter: setHasSwimmingPool,
                },
                { key: 'gym', label: 'Gym', state: hasGym, setter: setHasGym },
              ].map(({ key, label, state, setter }) => (
                <div key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={key}
                    checked={state}
                    onChange={(e) => setter(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor={key} className="cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleAnalyze} className="w-full" size="lg">
            <Calculator className="mr-2 h-4 w-4" />
            Analyze Property
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <>
          {/* Missing Data Alert */}
          {analysis.missingData.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Missing Information</AlertTitle>
              <AlertDescription>
                Please provide: {analysis.missingData.join(', ')} for accurate analysis
              </AlertDescription>
            </Alert>
          )}

          {/* Rent Ranges */}
          {analysis.rentRanges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Suggested Rent Ranges
                </CardTitle>
                <CardDescription>Market-based recommendations per unit type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.rentRanges.map((range, index) => {
                    const unit = units.find((u) => u.type === range.unitType);
                    const totalUnits = unit?.count || 1;
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{range.unitType}</h4>
                            <p className="text-sm text-gray-500">
                              {totalUnits} unit{totalUnits !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-lg">
                            {formatCurrency(range.marketAverage)}/year
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Min:</span>{' '}
                            <span className="font-medium">
                              {formatCurrency(range.suggestedMin)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Max:</span>{' '}
                            <span className="font-medium">
                              {formatCurrency(range.suggestedMax)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Avg:</span>{' '}
                            <span className="font-medium text-green-600">
                              {formatCurrency(range.marketAverage)}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Potential annual income:{' '}
                          {formatCurrency(range.marketAverage * totalUnits)}
                        </div>
                        {index < analysis.rentRanges.length - 1 && <Separator />}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deposit Recommendations */}
          {analysis.depositRecommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                  Deposit Recommendations
                </CardTitle>
                <CardDescription>
                  Standard practice: 1 year rent as security deposit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.depositRecommendations.map((deposit, index) => {
                    const unit = units.find((u) => u.type === deposit.unitType);
                    const totalUnits = unit?.count || 1;
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg bg-blue-50 p-3"
                      >
                        <div>
                          <span className="font-medium">{deposit.unitType}</span>
                          <span className="ml-2 text-sm text-gray-500">
                            ({totalUnits} unit{totalUnits !== 1 ? 's' : ''})
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {formatCurrency(deposit.recommendedDeposit)}
                          </div>
                          <div className="text-xs text-gray-500">per unit</div>
                        </div>
                      </div>
                    );
                  })}
                  <Alert>
                    <AlertDescription className="text-sm">
                      <strong>Note:</strong> In Nigeria, security deposits typically range from 6
                      months to 2 years rent. The recommended 1 year deposit provides good
                      protection while remaining competitive.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Utility Billing */}
          {analysis.utilityBilling.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Utility Billing Structure
                </CardTitle>
                <CardDescription>Recommended utility management approach</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-yellow-50 p-3">
                  <div className="mb-1 font-semibold">Recommended Structure:</div>
                  <div>{analysis.utilityBilling.structure}</div>
                </div>
                <div>
                  <div className="mb-2 font-semibold">Estimated Monthly Utility Costs:</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(analysis.utilityBilling.estimatedMonthly)}
                  </div>
                </div>
                <div>
                  <div className="mb-2 font-semibold">Recommendations:</div>
                  <ul className="space-y-1">
                    {analysis.utilityBilling.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="mt-1 text-yellow-500">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Maintenance Costs */}
          {analysis.maintenanceCosts.monthlyEstimate > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-orange-500" />
                  Maintenance Cost Expectations
                </CardTitle>
                <CardDescription>Budget planning for property maintenance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-orange-50 p-3">
                    <div className="text-sm text-gray-600">Monthly Estimate</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(analysis.maintenanceCosts.monthlyEstimate)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-orange-50 p-3">
                    <div className="text-sm text-gray-600">Annual Estimate</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(analysis.maintenanceCosts.annualEstimate)}
                    </div>
                  </div>
                </div>
                {analysis.maintenanceCosts.perUnitMonthly > 0 && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-sm text-gray-600">Per Unit Monthly</div>
                    <div className="text-xl font-semibold">
                      {formatCurrency(analysis.maintenanceCosts.perUnitMonthly)}
                    </div>
                  </div>
                )}
                <div>
                  <div className="mb-2 font-semibold">Recommendations:</div>
                  <ul className="space-y-2">
                    {analysis.maintenanceCosts.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
