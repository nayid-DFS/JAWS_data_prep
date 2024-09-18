import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import { Paper, Typography } from '@mui/material';

const DataPreview = ({ files }) => {
  const [gridApi, setGridApi] = useState(null);
  const [gridColumnApi, setGridColumnApi] = useState(null);
  const [rowData, setRowData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);

  useEffect(() => {
    if (files.length > 0) {
      const latestFile = files[files.length - 1];
      const columns = Object.keys(latestFile.data[0] || {}).map((key) => ({
        headerName: key,
        field: key,
        editable: true,
        sortable: true,
        filter: true,
      }));
      setColumnDefs(columns);
      setRowData(latestFile.data);
    }
  }, [files]);

  const onGridReady = (params) => {
    setGridApi(params.api);
    setGridColumnApi(params.columnApi);
  };

  return (
    <Paper sx={{ padding: '20px', marginTop: '20px' }}>
      <Typography variant="h5" gutterBottom>
        Data Preview
      </Typography>
      <div className="ag-theme-material" style={{ height: 400, width: '100%' }}>
        <AgGridReact
          columnDefs={columnDefs}
          rowData={rowData}
          onGridReady={onGridReady}
          pagination={true}
          paginationPageSize={10}
        />
      </div>
    </Paper>
  );
};

export default DataPreview;