import React, { useState } from 'react';
import { Grid, Button, Typography, Accordion, AccordionSummary, AccordionDetails, IconButton, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FilePreview from './FilePreview';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const FileUpload = ({ setUploadedFiles, preProcessedData, setPreProcessedData, templateFile, setTemplateFile, templateJoinColumn, setTemplateJoinColumn, setTemplateData, addAuditLog }) => {
  const sectors = ['Nutrition', 'Health', 'WASH', 'Early Recovery', 'Shelter', 'Protection', 'Education'];
  const [files, setFiles] = useState({});
  const [templateColumns, setTemplateColumns] = useState([]);

  const handleFileUpload = (event, sector) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        let parsedData;
        if (file.name.endsWith('.csv')) {
          parsedData = Papa.parse(data, { header: true }).data;
        } else if (file.name.endsWith('.xlsx')) {
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          parsedData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        }
        setFiles(prevFiles => ({
          ...prevFiles,
          [sector]: { name: file.name, data: parsedData }
        }));
        setUploadedFiles(prevFiles => ({
          ...prevFiles,
          [sector]: { name: file.name, data: parsedData }
        }));
        addAuditLog(`File uploaded for ${sector}: ${file.name} (${parsedData.length} rows, ${Object.keys(parsedData[0]).length} columns)`);
      };
      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else if (file.name.endsWith('.xlsx')) {
        reader.readAsArrayBuffer(file);
      }
    }
  };

  const handleTemplateUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        let parsedData;
        if (file.name.endsWith('.csv')) {
          parsedData = Papa.parse(data, { header: true }).data;
        } else if (file.name.endsWith('.xlsx')) {
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          parsedData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        }
        setTemplateFile(file);
        setTemplateColumns(Object.keys(parsedData[0]));
        setTemplateData(parsedData);
        addAuditLog(`Template file uploaded: ${file.name} (${parsedData.length} rows, ${Object.keys(parsedData[0]).length} columns)`);
      };
      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else if (file.name.endsWith('.xlsx')) {
        reader.readAsArrayBuffer(file);
      }
    }
  };

  const handleTemplateDownload = () => {
    if (templateFile) {
      const url = URL.createObjectURL(templateFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = templateFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addAuditLog(`Template file downloaded: ${templateFile.name}`);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <input
          accept=".csv,.xlsx"
          style={{ display: 'none' }}
          id="template-upload"
          type="file"
          onChange={handleTemplateUpload}
        />
        <label htmlFor="template-upload">
          <Button variant="contained" component="span" startIcon={<FileUploadIcon />}>
            Upload Template
          </Button>
        </label>
        <IconButton 
          onClick={handleTemplateDownload} 
          color="primary" 
          disabled={!templateFile}
          sx={{ ml: 2 }}
        >
          <FileDownloadIcon />
        </IconButton>
        {templateFile && (
          <>
            <Typography variant="body2">
              Template: {templateFile.name}
            </Typography>
            <FormControl sx={{ minWidth: 120, ml: 2 }} size="small">
              <InputLabel>Join Column</InputLabel>
              <Select
                value={templateJoinColumn}
                onChange={(e) => {
                  setTemplateJoinColumn(e.target.value);
                  addAuditLog(`Template join column set to: ${e.target.value}`);
                }}
                label="Join Column"
              >
                {templateColumns.map((column) => (
                  <MenuItem key={column} value={column}>{column}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}
      </Grid>
      {sectors.map((sector) => (
        <Grid item xs={12} key={sector}>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${sector}-content`}
              id={`${sector}-header`}
            >
              <Typography variant="subtitle1">{sector}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <input
                accept=".csv,.xlsx"
                style={{ display: 'none' }}
                id={`file-upload-${sector}`}
                type="file"
                onChange={(e) => handleFileUpload(e, sector)}
              />
              <label htmlFor={`file-upload-${sector}`}>
                <Button variant="contained" component="span">
                  Upload {sector} File
                </Button>
              </label>
              {files[sector] && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  File uploaded: {files[sector].name}
                </Typography>
              )}
              {files[sector] && (
                <FilePreview
                  file={files[sector]}
                  sector={sector}
                  preProcessedData={preProcessedData}
                  setPreProcessedData={setPreProcessedData}
                  addAuditLog={addAuditLog}
                />
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
      ))}
    </Grid>
  );
};

export default FileUpload;