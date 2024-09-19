import React, { useState } from 'react';
import { ThemeProvider, CssBaseline, Container, Typography, Button } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import FileUpload from './components/FileUpload';
import DataMerging from './components/DataMerging';
import AuditLog from './components/AuditLog';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';

const theme = createTheme();

function App() {
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [preProcessedData, setPreProcessedData] = useState({});
  const [mergedData, setMergedData] = useState(null);
  const [templateFile, setTemplateFile] = useState(null);
  const [templateJoinColumn, setTemplateJoinColumn] = useState('');
  const [templateData, setTemplateData] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogOpen, setAuditLogOpen] = useState(false);

  const addAuditLog = (message) => {
    setAuditLogs(prevLogs => [...prevLogs, { message, timestamp: new Date() }]);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <h1>JAWS - Data Analysis</h1>
        <Button 
          variant="outlined" 
          onClick={() => setAuditLogOpen(true)} 
          style={{ marginBottom: '20px' }}
        >
          Audit Log
        </Button>
        <FileUpload 
          setUploadedFiles={setUploadedFiles} 
          preProcessedData={preProcessedData} 
          setPreProcessedData={setPreProcessedData} 
          templateFile={templateFile}
          setTemplateFile={setTemplateFile}
          templateJoinColumn={templateJoinColumn}
          setTemplateJoinColumn={setTemplateJoinColumn}
          setTemplateData={setTemplateData}
          addAuditLog={addAuditLog}
        />
        <DataMerging 
          files={uploadedFiles} 
          preProcessedData={preProcessedData} 
          setMergedData={setMergedData}
          templateJoinColumn={templateJoinColumn}
          templateData={templateData}
          addAuditLog={addAuditLog}
        />
        <AuditLog 
          open={auditLogOpen} 
          onClose={() => setAuditLogOpen(false)} 
          logs={auditLogs} 
        />
      </Container>
    </ThemeProvider>
  );
}

export default App;