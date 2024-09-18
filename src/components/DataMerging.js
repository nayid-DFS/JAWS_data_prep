import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Paper, Typography, Tabs, Tab, Box, List, ListItem, ListItemText, Modal, TextField, Dialog, AppBar, Toolbar, IconButton, Checkbox, FormControlLabel, Accordion, AccordionSummary, AccordionDetails, Switch, FormGroup, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PushPinIcon from '@mui/icons-material/PushPin';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import './DataMerging.css';

const DataMerging = ({ files, preProcessedData, setMergedData, templateJoinColumn, templateData, addAuditLog }) => {
  const [mergedDataPreview, setMergedDataPreview] = useState({ pin: [], severity: [] });
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState(null);
  const [unmatchedValues, setUnmatchedValues] = useState({});
  const [formulasModalOpen, setFormulasModalOpen] = useState(false);
  const [differenceThreshold, setDifferenceThreshold] = useState(50);
  const [differenceThreshold3rd, setDifferenceThreshold3rd] = useState(50);
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [fullScreenGridApi, setFullScreenGridApi] = useState(null);
  const [pinnedColumns, setPinnedColumns] = useState([]);
  const [hiddenColumns, setHiddenColumns] = useState([]);

  useEffect(() => {
    console.log('templateData:', templateData);
    console.log('templateJoinColumn:', templateJoinColumn);
    console.log('files:', files);
    console.log('preProcessedData:', preProcessedData);
  }, [templateData, templateJoinColumn, files, preProcessedData]);

  const checkUnmatchedValues = () => {
    const templateValues = new Set(templateData.map(row => String(row[templateJoinColumn])));
    const unmatchedBySector = {};

    Object.entries(preProcessedData).forEach(([sector, sectorData]) => {
      if (sectorData.readyForMerge) {
        const sectorValues = new Set(sectorData.data.map(row => String(row[sectorData.joinColumn])));
        const unmatched = [...sectorValues].filter(value => !templateValues.has(value));
        if (unmatched.length > 0) {
          unmatchedBySector[sector] = unmatched;
          addAuditLog(`${sector}: ${unmatched.length} unmatched values found`);
        }
      }
    });

    setUnmatchedValues(unmatchedBySector);
    return Object.keys(unmatchedBySector).length === 0;
  };

  const mergeData = () => {
    setError(null);
    if (!templateData || templateData.length === 0) {
      setError('Template data is missing. Please upload a template file.');
      addAuditLog('Merge failed: Template data is missing');
      return;
    }
    if (!templateJoinColumn) {
      setError('Template join column is not selected. Please select a join column for the template.');
      addAuditLog('Merge failed: Template join column not selected');
      return;
    }

    const allMatched = checkUnmatchedValues();
    if (!allMatched) {
      setError('There are unmatched values in some sectors. Please review the unmatched values below.');
      addAuditLog('Merge failed: Unmatched values found');
      return;
    }

    const mergedPinData = {};
    const mergedSeverityData = {};
    const readySectors = Object.keys(preProcessedData).filter(sector => preProcessedData[sector].readyForMerge);

    // Initialize merged data with template data
    templateData.forEach(row => {
      const key = String(row[templateJoinColumn]);
      mergedPinData[key] = { ...row };
      mergedSeverityData[key] = { ...row };
    });

    // Perform left join for each ready sector
    readySectors.forEach(sector => {
      const { joinColumn, pinColumn, severityColumn, data } = preProcessedData[sector];

      // Create a lookup object for the sector data
      const sectorDataLookup = {};
      data.forEach(row => {
        sectorDataLookup[String(row[joinColumn])] = row;
      });

      // Perform the left join
      Object.keys(mergedPinData).forEach(key => {
        const sectorRow = sectorDataLookup[key];
        if (sectorRow) {
          mergedPinData[key][`PiN_${sector}`] = Number(sectorRow[pinColumn]);
          mergedSeverityData[key][`Severity_${sector}`] = Number(sectorRow[severityColumn]);
        } else {
          mergedPinData[key][`PiN_${sector}`] = null;
          mergedSeverityData[key][`Severity_${sector}`] = null;
        }
      });
    });

    const mergedPinDataArray = Object.values(mergedPinData);
    const mergedSeverityDataArray = Object.values(mergedSeverityData);

    console.log('Merged PiN Data (first row):', mergedPinDataArray[0]);
    console.log('Merged Severity Data (first row):', mergedSeverityDataArray[0]);

    // Calculate additional fields for PiN data
    const enhancedPinData = mergedPinDataArray.map((row) => {
      const enhancedRow = { ...row };
      const sectors = Object.keys(row).filter(key => key.startsWith('PiN_'));
      
      const population = Number(row[' Population ']);
      
      // Calculate PiN percentages
      sectors.forEach(sector => {
        const pinValue = Number(row[sector]);
        
        if (!isNaN(pinValue) && !isNaN(population) && population !== 0) {
          const percentage = (pinValue / population) * 100;
          enhancedRow[`${sector}_%`] = percentage;
        } else {
          enhancedRow[`${sector}_%`] = null;
        }
      });

      // Calculate top 3 PiN values
      const pinValues = sectors.map(sector => ({
        sector: sector.replace('PiN_', ''),
        value: Number(row[sector]),
        percentage: enhancedRow[`${sector}_%`]
      })).filter(item => !isNaN(item.value) && item.value !== null).sort((a, b) => b.value - a.value);

      ['Highest', 'Second Highest', 'Third Highest'].forEach((label, index) => {
        if (pinValues[index]) {
          enhancedRow[`${label} PiN`] = Math.round(pinValues[index].value);
          enhancedRow[`${label} PiN Sector`] = pinValues[index].sector;
          enhancedRow[`${label} PiN %`] = pinValues[index].percentage;
        } else {
          enhancedRow[`${label} PiN`] = null;
          enhancedRow[`${label} PiN Sector`] = '';
          enhancedRow[`${label} PiN %`] = null;
        }
      });

      // Calculate new columns
      if (pinValues[0] && pinValues[1]) {
        enhancedRow['Difference Highest and 2nd Highest'] = Math.round(pinValues[0].value - pinValues[1].value);
        enhancedRow['% Difference Highest and 2nd Highest'] = 
          ((pinValues[0].value - pinValues[1].value) / pinValues[1].value) * 100;
        enhancedRow['Difference over threshold'] = 
          enhancedRow['% Difference Highest and 2nd Highest'] > differenceThreshold;
      } else {
        enhancedRow['Difference Highest and 2nd Highest'] = null;
        enhancedRow['% Difference Highest and 2nd Highest'] = null;
        enhancedRow['Difference over threshold'] = null;
      }

      // New columns for 3rd highest
      if (pinValues[0] && pinValues[2]) {
        enhancedRow['Difference Highest and 3rd Highest'] = Math.round(pinValues[0].value - pinValues[2].value);
        enhancedRow['% Difference Highest and 3rd Highest'] = 
          ((pinValues[0].value - pinValues[2].value) / pinValues[2].value) * 100;
        enhancedRow['Difference over threshold 3rd'] = 
          enhancedRow['% Difference Highest and 3rd Highest'] > differenceThreshold3rd;
      } else {
        enhancedRow['Difference Highest and 3rd Highest'] = null;
        enhancedRow['% Difference Highest and 3rd Highest'] = null;
        enhancedRow['Difference over threshold 3rd'] = null;
      }

      // Calculate total number of Flagged occurrences
      const flaggedCount = (enhancedRow['Difference over threshold'] ? 1 : 0) +
                           (enhancedRow['Difference over threshold 3rd'] ? 1 : 0);
      
      enhancedRow['Total Flagged'] = flaggedCount;
      enhancedRow['Row Flagged'] = flaggedCount > 0;

      console.log('Debug: Highest PiN Sector', pinValues[0]?.sector);
      console.log('Debug: Second Highest PiN Sector', pinValues[1]?.sector);
      console.log('Debug: Third Highest PiN Sector', pinValues[2]?.sector);

      return enhancedRow;
    });

    console.log('Enhanced PiN Data (first row):', enhancedPinData[0]);
    console.log('Enhanced PiN Data (all rows):', JSON.stringify(enhancedPinData, null, 2));

    setMergedData({ pin: enhancedPinData, severity: mergedSeverityDataArray });
    setMergedDataPreview({ pin: enhancedPinData, severity: mergedSeverityDataArray });
    addAuditLog(`Data merged successfully: ${enhancedPinData.length} rows, ${Object.keys(enhancedPinData[0]).length} columns for PiN, ${Object.keys(mergedSeverityDataArray[0]).length} columns for Severity`);
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return '';
    return Math.round(Number(value)).toLocaleString();
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '';
    const numValue = Number(value);
    if (isNaN(numValue)) return '';
    return `${numValue.toFixed(2)}%`;
  };

  const createColumnDefs = (data, isPin, pinnedCols, hiddenCols) => {
    if (!data || data.length === 0) {
      return [];
    }
    return Object.keys(data[0]).map(key => {
      const isCalculated = key.endsWith('_%') || 
                           ['Highest', 'Second Highest', 'Third Highest'].some(label => key.startsWith(label)) || 
                           key.includes('Difference') ||
                           key === 'Total Flagged' ||
                           key === 'Row Flagged';
      const columnDef = {
        headerName: key.trim(),
        field: key,
        sortable: true,
        filter: true,
        resizable: true,
        headerClass: isCalculated ? 'calculated-column' : '',
        editable: !isCalculated && key !== templateJoinColumn,
        pinned: pinnedCols.includes(key) ? 'left' : null,
        hide: hiddenCols.includes(key),
      };

      if (key.endsWith('PiN Sector')) {
        columnDef.valueGetter = (params) => params.data[key];
      } else if (key === 'Difference over threshold' || 
                 key === 'Difference over threshold 3rd' || 
                 key === 'Row Flagged') {
        columnDef.cellRenderer = (params) => {
          return params.value === true ? 'Flagged' : '';
        };
        columnDef.cellClass = (params) => {
          return params.value === true ? 'flagged-cell' : '';
        };
      } else {
        columnDef.valueFormatter = (params) => {
          if (params.value === null || params.value === undefined) return '';
          if (key === ' Population ' || 
              (key.startsWith('PiN_') && !key.includes('%')) || 
              key === 'Difference Highest and 2nd Highest' ||
              key === 'Difference Highest and 3rd Highest' ||
              key === 'Total Flagged') {
            return formatNumber(params.value);
          } else if (key.endsWith('_%') || 
                     key.endsWith('PiN %') || 
                     (key.startsWith('PiN_') && key.includes('%')) || 
                     key === '% Difference Highest and 2nd Highest' ||
                     key === '% Difference Highest and 3rd Highest') {
            return formatPercentage(params.value);
          }
          return params.value;
        };
      }

      return columnDef;
    });
  };

  const pinColumns = mergedDataPreview.pin.length > 0 ? createColumnDefs(mergedDataPreview.pin, true, pinnedColumns, hiddenColumns) : [];
  const severityColumns = mergedDataPreview.severity.length > 0 ? createColumnDefs(mergedDataPreview.severity, false, pinnedColumns, hiddenColumns) : [];

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formulas = [
    { name: 'PiN_%', formula: 'PiN_[Sector] / Population * 100' },
    { name: 'Highest PiN', formula: 'MAX(PiN_[All Sectors])' },
    { name: 'Highest PiN Sector', formula: 'SECTOR of MAX(PiN_[All Sectors])' },
    { name: 'Highest PiN %', formula: 'MAX(PiN_%_[All Sectors])' },
    { name: 'Second Highest PiN', formula: 'SECOND_MAX(PiN_[All Sectors])' },
    { name: 'Second Highest PiN Sector', formula: 'SECTOR of SECOND_MAX(PiN_[All Sectors])' },
    { name: 'Second Highest PiN %', formula: 'SECOND_MAX(PiN_%_[All Sectors])' },
    { name: 'Third Highest PiN', formula: 'THIRD_MAX(PiN_[All Sectors])' },
    { name: 'Third Highest PiN Sector', formula: 'SECTOR of THIRD_MAX(PiN_[All Sectors])' },
    { name: 'Third Highest PiN %', formula: 'THIRD_MAX(PiN_%_[All Sectors])' },
    { name: 'Difference Highest and 2nd Highest', formula: 'Highest PiN - Second Highest PiN' },
    { name: '% Difference Highest and 2nd Highest', formula: '((Highest PiN - Second Highest PiN) / Second Highest PiN) * 100' },
    { name: 'Difference over threshold', formula: '% Difference Highest and 2nd Highest > Threshold (default 50%)' },
    { name: 'Difference Highest and 3rd Highest', formula: 'Highest PiN - Third Highest PiN' },
    { name: '% Difference Highest and 3rd Highest', formula: '((Highest PiN - Third Highest PiN) / Third Highest PiN) * 100' },
    { name: 'Difference over threshold 3rd', formula: '% Difference Highest and 3rd Highest > Threshold 3rd (default 50%)' },
    { name: 'Total Flagged', formula: 'COUNT(Flagged columns)' },
    { name: 'Row Flagged', formula: 'IF(Total Flagged > 0, "Flagged", "")' },
  ];

  const handleFullScreenOpen = () => {
    setFullScreenOpen(true);
  };

  const handleFullScreenClose = () => {
    setFullScreenOpen(false);
  };

  const onGridReady = useCallback((params) => {
    setGridApi(params.api);
  }, []);

  const onFullScreenGridReady = useCallback((params) => {
    setFullScreenGridApi(params.api);
  }, []);

  const handleCellValueChanged = useCallback((event) => {
    const updatedData = { ...mergedDataPreview };
    updatedData.pin = updatedData.pin.map(row => 
      row[templateJoinColumn] === event.data[templateJoinColumn] ? event.data : row
    );
    setMergedDataPreview(updatedData);
    setMergedData(updatedData);
    addAuditLog(`Cell value changed: ${event.colDef.field} for ${event.data[templateJoinColumn]}`);
  }, [mergedDataPreview, setMergedData, templateJoinColumn, addAuditLog]);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    wrapHeaderText: true,
    autoHeaderHeight: true,
    headerClass: 'wrap-text-header',
    suppressSizeToFit: true, // Prevent columns from auto-sizing
    minWidth: 100, // Set a minimum width for columns
  }), []);

  const handleColumnPinChange = (event, columnName) => {
    const newPinnedColumns = event.target.checked
      ? [...pinnedColumns, columnName]
      : pinnedColumns.filter(col => col !== columnName);
    setPinnedColumns(newPinnedColumns);
    updateGridColumns(newPinnedColumns, hiddenColumns);
  };

  const handleColumnVisibilityChange = (event, columnName) => {
    const newHiddenColumns = event.target.checked
      ? hiddenColumns.filter(col => col !== columnName)
      : [...hiddenColumns, columnName];
    setHiddenColumns(newHiddenColumns);
    updateGridColumns(pinnedColumns, newHiddenColumns);
  };

  const updateGridColumns = (pinned, hidden) => {
    const newColumnDefs = createColumnDefs(mergedDataPreview.pin, true, pinned, hidden);
    if (gridApi) {
      gridApi.setColumnDefs(newColumnDefs);
    }
    if (fullScreenGridApi) {
      fullScreenGridApi.setColumnDefs(newColumnDefs);
    }
  };

  const ColumnControls = ({ columns }) => {
    const [expanded, setExpanded] = useState(true);

    const handleAccordionChange = (event, isExpanded) => {
      setExpanded(isExpanded);
    };

    const categorizeColumns = (columns) => {
      return columns.reduce((acc, column) => {
        if (column.field.startsWith('PiN_') || column.field.startsWith('Severity_')) {
          acc.Sector.push(column);
        } else if (column.field.includes('Highest') || column.field.includes('Difference') || column.field === 'Total Flagged' || column.field === 'Row Flagged') {
          acc.Calculated.push(column);
        } else {
          acc.Template.push(column);
        }
        return acc;
      }, { Template: [], Sector: [], Calculated: [] });
    };

    const categorizedColumns = categorizeColumns(columns);

    return (
      <Accordion 
        expanded={expanded} 
        onChange={handleAccordionChange}
        sx={{ mb: 2, boxShadow: 3, '&:before': { display: 'none' } }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel-content"
          id="panel-header"
          sx={{ 
            backgroundColor: 'primary.main', 
            color: 'primary.contrastText',
            '& .MuiAccordionSummary-expandIconWrapper': {
              color: 'primary.contrastText',
            },
          }}
        >
          <Typography sx={{ display: 'flex', alignItems: 'center' }}>
            <PushPinIcon sx={{ mr: 1 }} /> Column Controls
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {Object.entries(categorizedColumns).map(([category, cols]) => (
              <Box key={category} sx={{ minWidth: '200px', flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>{category}</Typography>
                <FormGroup>
                  {cols.map((column) => (
                    <Box key={column.field} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ flex: 1, mr: 1 }}>{column.headerName}</Typography>
                      <Tooltip title="Pin column">
                        <Switch
                          checked={pinnedColumns.includes(column.field)}
                          onChange={(e) => handleColumnPinChange(e, column.field)}
                          size="small"
                        />
                      </Tooltip>
                      <Tooltip title="Toggle visibility">
                        <Switch
                          checked={!hiddenColumns.includes(column.field)}
                          onChange={(e) => handleColumnVisibilityChange(e, column.field)}
                          size="small"
                          icon={<VisibilityOffIcon />}
                          checkedIcon={<VisibilityIcon />}
                        />
                      </Tooltip>
                    </Box>
                  ))}
                </FormGroup>
              </Box>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Paper sx={{ padding: '20px', marginTop: '20px' }}>
      <Typography variant="h5" gutterBottom>
        Data Merging
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={mergeData}
        sx={{ mb: 2, mr: 2 }}
      >
        Merge Data
      </Button>
      <Button
        variant="outlined"
        color="primary"
        onClick={() => setFormulasModalOpen(true)}
        sx={{ mb: 2, mr: 2 }}
      >
        View Formulas
      </Button>
      {mergedDataPreview.pin.length > 0 && (
        <Button
          variant="outlined"
          color="primary"
          onClick={handleFullScreenOpen}
          sx={{ mb: 2 }}
        >
          View Full Screen
        </Button>
      )}
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      {Object.keys(unmatchedValues).length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Unmatched Values:</Typography>
          {Object.entries(unmatchedValues).map(([sector, values]) => (
            <Box key={sector}>
              <Typography variant="subtitle1">{sector}:</Typography>
              <List dense>
                {values.map((value, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={value} />
                  </ListItem>
                ))}
              </List>
            </Box>
          ))}
        </Box>
      )}
      {mergedDataPreview.pin.length > 0 && (
        <>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label={`PiN Data (${mergedDataPreview.pin.length} rows, ${pinColumns.length} columns)`} />
            <Tab label={`Severity Data (${mergedDataPreview.severity.length} rows, ${severityColumns.length} columns)`} />
          </Tabs>
          <TabPanel value={tabValue} index={0}>
            <ColumnControls columns={pinColumns} />
            <div className="ag-theme-material" style={{ height: '400px', width: '100%' }}>
              <AgGridReact
                rowData={mergedDataPreview.pin}
                columnDefs={createColumnDefs(mergedDataPreview.pin, true, pinnedColumns, hiddenColumns)}
                defaultColDef={defaultColDef}
                pagination={true}
                paginationPageSize={10}
                domLayout='normal'
                onGridReady={onGridReady}
                onCellValueChanged={handleCellValueChanged}
                enableColResize={true}
                colResizeDefault={'shift'}
              />
            </div>
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <ColumnControls columns={severityColumns} />
            <div className="ag-theme-material" style={{ height: '400px', width: '100%' }}>
              <AgGridReact
                rowData={mergedDataPreview.severity}
                columnDefs={createColumnDefs(mergedDataPreview.severity, false, pinnedColumns, hiddenColumns)}
                defaultColDef={defaultColDef}
                pagination={true}
                paginationPageSize={10}
                domLayout='normal'
                enableColResize={true}
                colResizeDefault={'shift'}
              />
            </div>
          </TabPanel>
        </>
      )}
      <Modal
        open={formulasModalOpen}
        onClose={() => setFormulasModalOpen(false)}
        aria-labelledby="formulas-modal-title"
        aria-describedby="formulas-modal-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          p: 4,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}>
          <Typography id="formulas-modal-title" variant="h6" component="h2">
            Formulas Used
          </Typography>
          <TextField
            type="number"
            label="Difference Threshold (%) for 2nd Highest"
            value={differenceThreshold}
            onChange={(e) => setDifferenceThreshold(Number(e.target.value))}
            sx={{ mb: 2, mt: 2 }}
            fullWidth
          />
          <TextField
            type="number"
            label="Difference Threshold (%) for 3rd Highest"
            value={differenceThreshold3rd}
            onChange={(e) => setDifferenceThreshold3rd(Number(e.target.value))}
            sx={{ mb: 2 }}
            fullWidth
          />
          <List>
            {formulas.map((formula, index) => (
              <ListItem key={index}>
                <ListItemText 
                  primary={formula.name} 
                  secondary={
                    formula.name === 'Difference over threshold' 
                      ? `${formula.formula} (${differenceThreshold}%)`
                      : formula.name === 'Difference over threshold 3rd'
                        ? `${formula.formula} (${differenceThreshold3rd}%)`
                        : formula.formula
                  } 
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Modal>
      
      <Dialog
        fullScreen
        open={fullScreenOpen}
        onClose={handleFullScreenClose}
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleFullScreenClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              Merged Data Table
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ height: 'calc(100vh - 64px)', width: '100%', display: 'flex', flexDirection: 'column' }}>
          <ColumnControls columns={pinColumns} />
          <Box sx={{ flexGrow: 1 }}>
            <AgGridReact
              rowData={mergedDataPreview.pin}
              columnDefs={createColumnDefs(mergedDataPreview.pin, true, pinnedColumns, hiddenColumns)}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={25}
              domLayout='normal'
              onGridReady={onFullScreenGridReady}
              onCellValueChanged={handleCellValueChanged}
              enableColResize={true}
              colResizeDefault={'shift'}
            />
          </Box>
        </Box>
      </Dialog>
    </Paper>
  );
};

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

export default DataMerging;