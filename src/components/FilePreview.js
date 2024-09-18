import React, { useState, useEffect, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import { Paper, Typography, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, Grid } from '@mui/material';

const FilePreview = ({ file, sector, preProcessedData, setPreProcessedData, addAuditLog }) => {
  const [joinColumn, setJoinColumn] = useState('');
  const [pinColumn, setPinColumn] = useState('');
  const [severityColumn, setSeverityColumn] = useState('');
  const [readyForMerge, setReadyForMerge] = useState(false);
  const [originalData, setOriginalData] = useState([]);
  const fileLoadedRef = useRef(false);

  useEffect(() => {
    if (file && file.data && !fileLoadedRef.current) {
      setOriginalData(file.data);
      addAuditLog(`${sector} file loaded: ${file.data.length} rows, ${Object.keys(file.data[0]).length} columns`);
      fileLoadedRef.current = true;
    }
  }, [file, sector, addAuditLog]);

  const columns = originalData.length > 0 ? Object.keys(originalData[0]).map(key => ({
    headerName: key,
    field: key,
    editable: !readyForMerge,
    sortable: true,
    filter: true,
  })) : [];

  useEffect(() => {
    setPreProcessedData(prev => ({
      ...prev,
      [sector]: { 
        joinColumn, 
        pinColumn, 
        severityColumn, 
        readyForMerge,
        data: originalData.map(row => ({
          [joinColumn]: row[joinColumn],
          [pinColumn]: row[pinColumn],
          [severityColumn]: row[severityColumn]
        }))
      }
    }));
  }, [joinColumn, pinColumn, severityColumn, readyForMerge, sector, setPreProcessedData, originalData]);

  return (
    <Paper sx={{ 
      padding: '20px', 
      marginTop: '20px', 
      backgroundColor: readyForMerge ? '#e8f5e9' : 'inherit',
      '& .MuiAccordion-root': {
        backgroundColor: readyForMerge ? '#e8f5e9' : 'inherit',
      }
    }}>
      <Typography variant="subtitle1" gutterBottom>
        {`${sector} - ${originalData.length} rows, ${columns.length} columns`}
      </Typography>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Join Column</InputLabel>
            <Select 
              value={joinColumn} 
              onChange={(e) => {
                setJoinColumn(e.target.value);
                addAuditLog(`${sector}: Join column set to ${e.target.value}`);
              }}
            >
              {columns.map(col => (
                <MenuItem key={col.field} value={col.field}>{col.headerName}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel>PiN Column</InputLabel>
            <Select 
              value={pinColumn} 
              onChange={(e) => {
                setPinColumn(e.target.value);
                addAuditLog(`${sector}: PiN column set to ${e.target.value}`);
              }}
            >
              {columns.map(col => (
                <MenuItem key={col.field} value={col.field}>{col.headerName}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Severity Column</InputLabel>
            <Select 
              value={severityColumn} 
              onChange={(e) => {
                setSeverityColumn(e.target.value);
                addAuditLog(`${sector}: Severity column set to ${e.target.value}`);
              }}
            >
              {columns.map(col => (
                <MenuItem key={col.field} value={col.field}>{col.headerName}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControlLabel
            control={
              <Checkbox
                checked={readyForMerge}
                onChange={(e) => {
                  setReadyForMerge(e.target.checked);
                  addAuditLog(`${sector}: ${e.target.checked ? 'Marked' : 'Unmarked'} as ready for merge`);
                }}
              />
            }
            label="Ready for Merge"
          />
        </Grid>
      </Grid>
      <div className="ag-theme-material" style={{ height: '400px', width: '100%', overflow: 'auto' }}>
        <AgGridReact
          columnDefs={columns}
          rowData={originalData}
          pagination={true}
          paginationPageSize={10}
          domLayout='normal'
        />
      </div>
    </Paper>
  );
};

export default FilePreview;