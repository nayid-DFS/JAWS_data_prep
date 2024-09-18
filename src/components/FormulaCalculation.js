import React, { useState } from 'react';
import { TextField, Button, Paper, Typography } from '@mui/material';
import { Parser } from 'hot-formula-parser';

const FormulaCalculation = ({ data }) => {
  const [formula, setFormula] = useState('');
  const [result, setResult] = useState('');

  const handleFormulaChange = (event) => {
    setFormula(event.target.value);
  };

  const calculateFormula = () => {
    const parser = new Parser();

    // Add custom functions
    parser.setFunction('SUM', (params) => {
      return params.reduce((sum, value) => sum + value, 0);
    });

    parser.setFunction('AVERAGE', (params) => {
      const sum = params.reduce((sum, value) => sum + value, 0);
      return sum / params.length;
    });

    // Set variables from data
    if (data && data.length > 0) {
      Object.keys(data[0]).forEach((key) => {
        parser.setVariable(key, data[0][key]);
      });
    }

    const result = parser.parse(formula);
    setResult(result.result);
  };

  return (
    <Paper sx={{ padding: '20px', marginTop: '20px' }}>
      <Typography variant="h5" gutterBottom>
        Formula Calculation
      </Typography>
      <TextField
        fullWidth
        label="Enter Formula"
        value={formula}
        onChange={handleFormulaChange}
        sx={{ marginBottom: '20px' }}
      />
      <Button variant="contained" color="primary" onClick={calculateFormula}>
        Calculate
      </Button>
      {result !== '' && (
        <Typography variant="h6" sx={{ marginTop: '20px' }}>
          Result: {result}
        </Typography>
      )}
    </Paper>
  );
};

export default FormulaCalculation;