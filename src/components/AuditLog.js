import React from 'react';
import { Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, Button } from '@mui/material';

const AuditLog = ({ open, onClose, logs }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Audit Log</DialogTitle>
      <DialogContent>
        <List>
          {logs.map((log, index) => (
            <ListItem key={index}>
              <ListItemText primary={log.message} secondary={new Date(log.timestamp).toLocaleString()} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <Button onClick={onClose}>Close</Button>
    </Dialog>
  );
};

export default AuditLog;