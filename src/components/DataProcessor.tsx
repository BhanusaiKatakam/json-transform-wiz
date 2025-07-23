import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Database, 
  FileText, 
  Settings,
  ArrowRight
} from 'lucide-react';
import { districts, taluka_code, district_taluka_sales_person_mapping } from '@/data/tables';

interface ValidationResult {
  field: string;
  status: 'valid' | 'invalid';
  message: string;
}

interface ProcessingStep {
  id: number;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  icon: React.ElementType;
  description: string;
}

const DataProcessor = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [businessRulesResults, setBusinessRulesResults] = useState<string[]>([]);
  const [etlResults, setEtlResults] = useState<any>(null);
  const [finalOutput, setFinalOutput] = useState('');
  const [progress, setProgress] = useState(0);

  const steps: ProcessingStep[] = [
    {
      id: 1,
      name: 'Field Validation',
      status: 'pending',
      icon: CheckCircle,
      description: 'Validating JSON structure and required fields'
    },
    {
      id: 2,
      name: 'Business Rules',
      status: 'pending', 
      icon: Settings,
      description: 'Applying business logic and constraints'
    },
    {
      id: 3,
      name: 'ETL Processing',
      status: 'pending',
      icon: Database,
      description: 'Fetching and transforming data from external sources'
    },
    {
      id: 4,
      name: 'Final Output',
      status: 'pending',
      icon: FileText,
      description: 'Generating processed JSON output'
    }
  ];

  const simulateFieldValidation = async (): Promise<ValidationResult[]> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      const parsed = JSON.parse(jsonInput);
      const results: ValidationResult[] = [];
      
      // Check required fields
      const requiredFields = ['district_code', 'taluka_code', 'sales_person'];
      requiredFields.forEach(field => {
        if (!parsed[field]) {
          results.push({
            field,
            status: 'invalid',
            message: `${field} is required`
          });
        }
      });

      // Validate district_code exists in districts table
      if (parsed.district_code) {
        const districtExists = districts.some(d => d.district_code === parsed.district_code);
        results.push({
          field: 'district_code',
          status: districtExists ? 'valid' : 'invalid',
          message: districtExists ? 'District code exists in table' : 'District code not found in table'
        });
      }

      // Validate taluka_code exists in taluka table
      if (parsed.taluka_code) {
        const talukaExists = taluka_code.some(t => t.taluka_code === parsed.taluka_code);
        results.push({
          field: 'taluka_code',
          status: talukaExists ? 'valid' : 'invalid',
          message: talukaExists ? 'Taluka code exists in table' : 'Taluka code not found in table'
        });
      }

      // Validate sales_person has minimum 4 characters
      if (parsed.sales_person) {
        const salesPersonValid = parsed.sales_person.length >= 4;
        results.push({
          field: 'sales_person',
          status: salesPersonValid ? 'valid' : 'invalid',
          message: salesPersonValid ? 'Sales person name is valid' : 'Sales person name must be at least 4 characters'
        });
      }
      
      return results;
    } catch {
      return [{
        field: 'json',
        status: 'invalid',
        message: 'Invalid JSON format'
      }];
    }
  };

  const simulateBusinessRules = async (): Promise<string[]> => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    try {
      const parsed = JSON.parse(jsonInput);
      const rules: string[] = [];
      
      // Check if sales person exists more than 2 times in mapping table
      if (parsed.sales_person) {
        const salesPersonCount = district_taluka_sales_person_mapping.filter(
          mapping => mapping.sales_person === parsed.sales_person
        ).length;
        
        if (salesPersonCount < 2) {
          rules.push('Sales person assignment limit validation passed');
        } else {
          rules.push('ERROR: Sales person already exists 2 or more times in mapping table');
        }
      }
      
      return rules;
    } catch {
      return ['ERROR: Invalid JSON format for business rules validation'];
    }
  };

  const simulateETL = async (): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const parsed = JSON.parse(jsonInput);
      
      // Get district name from district_code
      const district = districts.find(d => d.district_code === parsed.district_code);
      const district_name = district?.district_name || '';
      
      // Get taluka name from taluka_code
      const taluka = taluka_code.find(t => t.taluka_code === parsed.taluka_code);
      const taluka_name = taluka?.taluka_name || '';
      
      return {
        district_name,
        taluka_name,
        enrichmentDate: new Date().toISOString()
      };
    } catch {
      return {
        district_name: '',
        taluka_name: '',
        enrichmentDate: new Date().toISOString(),
        error: 'Failed to process ETL data'
      };
    }
  };

  const processData = async () => {
    if (!jsonInput.trim()) {
      alert('Please enter JSON data to process');
      return;
    }

    setIsProcessing(true);
    setCurrentStep(1);
    setProgress(10);

    try {
      // Step 1: Field Validation
      setProgress(25);
      const validationResults = await simulateFieldValidation();
      setValidationResults(validationResults);
      
      const hasErrors = validationResults.some(r => r.status === 'invalid');
      if (hasErrors) {
        setCurrentStep(0);
        setIsProcessing(false);
        return;
      }
      
      setCurrentStep(2);
      setProgress(45);

      // Step 2: Business Rules
      const businessResults = await simulateBusinessRules();
      setBusinessRulesResults(businessResults);
      setCurrentStep(3);
      setProgress(65);

      // Step 3: ETL Processing
      const etlData = await simulateETL();
      setEtlResults(etlData);
      setCurrentStep(4);
      setProgress(85);

      // Step 4: Generate Final Output
      await new Promise(resolve => setTimeout(resolve, 800));
      const inputData = JSON.parse(jsonInput);
      const finalData = {
        district_code: inputData.district_code,
        district_name: etlData.district_name,
        taluka_code: inputData.taluka_code,
        taluka_name: etlData.taluka_name,
        sales_person: inputData.sales_person
      };
      
      // Push to table (simulate)
      district_taluka_sales_person_mapping.push(finalData);
      
      setFinalOutput(JSON.stringify(finalData, null, 2));
      setProgress(100);
      setCurrentStep(5);
      
    } catch (error) {
      console.error('Processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetProcess = () => {
    setCurrentStep(0);
    setProgress(0);
    setValidationResults([]);
    setBusinessRulesResults([]);
    setEtlResults(null);
    setFinalOutput('');
  };

  const getStepStatus = (stepId: number): ProcessingStep['status'] => {
    if (currentStep === stepId && isProcessing) return 'processing';
    if (currentStep > stepId) return 'completed';
    if (currentStep === stepId && validationResults.some(r => r.status === 'invalid')) return 'error';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Data Processing Pipeline
          </h1>
          <p className="text-muted-foreground text-lg">
            Transform and enrich your JSON data through our advanced processing pipeline
          </p>
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Processing Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Process Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const status = getStepStatus(step.id);
            
            return (
              <Card 
                key={step.id} 
                className={`transition-all duration-300 ${
                  status === 'completed' ? 'border-success/50 bg-success/5' :
                  status === 'processing' ? 'border-primary/50 bg-primary/5 animate-pulse' :
                  status === 'error' ? 'border-destructive/50 bg-destructive/5' :
                  'border-border/50'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Icon className={`w-6 h-6 ${
                      status === 'completed' ? 'text-success' :
                      status === 'processing' ? 'text-primary' :
                      status === 'error' ? 'text-destructive' :
                      'text-muted-foreground'
                    }`} />
                    {status === 'processing' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  </div>
                  <CardTitle className="text-lg">{step.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                  <Badge variant={
                    status === 'completed' ? 'default' :
                    status === 'processing' ? 'secondary' :
                    status === 'error' ? 'destructive' :
                    'outline'
                  }>
                    {status === 'completed' ? 'Completed' :
                     status === 'processing' ? 'Processing' :
                     status === 'error' ? 'Error' :
                     'Pending'}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                JSON Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='Enter your JSON data here, e.g.:
{
  "district_code": "AHM001",
  "taluka_code": "AHM-T001",
  "sales_person": "Kiran Shah"
}'
                className="min-h-[200px] font-mono text-sm border-input"
              />
              <div className="flex gap-3">
                <Button 
                  onClick={processData}
                  disabled={isProcessing || !jsonInput.trim()}
                  variant="gradient"
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Start Processing
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
                <Button onClick={resetProcess} variant="outline">
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card className="border-success/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Final Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={finalOutput}
                readOnly
                placeholder="Processed JSON will appear here..."
                className="min-h-[200px] font-mono text-sm bg-muted/30"
              />
              {finalOutput && (
                <Button 
                  variant="success" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => navigator.clipboard.writeText(finalOutput)}
                >
                  Copy Output
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Panels */}
        {validationResults.length > 0 && (
          <Card className="border-info/20">
            <CardHeader>
              <CardTitle>Field Validation Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {validationResults.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.status === 'valid' 
                        ? 'border-success/30 bg-success/5' 
                        : 'border-destructive/30 bg-destructive/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {result.status === 'valid' ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      )}
                      <span className="font-medium">{result.field}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {businessRulesResults.length > 0 && (
          <Card className="border-success/20">
            <CardHeader>
              <CardTitle>Business Rules Validation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {businessRulesResults.map((rule, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded bg-success/5">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">{rule}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {etlResults && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>ETL Enrichment Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted/30 p-4 rounded-lg overflow-auto">
                {JSON.stringify(etlResults, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DataProcessor;