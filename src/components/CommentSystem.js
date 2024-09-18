import React, { useState } from 'react';
import { TextField, Button, Paper, Typography, List, ListItem, ListItemText } from '@mui/material';

const CommentSystem = () => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const handleCommentChange = (event) => {
    setNewComment(event.target.value);
  };

  const addComment = () => {
    if (newComment.trim() !== '') {
      setComments([...comments, newComment]);
      setNewComment('');
    }
  };

  return (
    <Paper sx={{ padding: '20px', marginTop: '20px' }}>
      <Typography variant="h5" gutterBottom>
        Comment System
      </Typography>
      <TextField
        fullWidth
        label="Add a comment"
        value={newComment}
        onChange={handleCommentChange}
        sx={{ marginBottom: '20px' }}
      />
      <Button variant="contained" color="primary" onClick={addComment}>
        Add Comment
      </Button>
      <List>
        {comments.map((comment, index) => (
          <ListItem key={index}>
            <ListItemText primary={comment} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default CommentSystem;