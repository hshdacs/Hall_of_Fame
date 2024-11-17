import { useState } from 'react';
import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import Label from '../../../components/label';

// ----------------------------------------------------------------------

const getStatusColor = (status) => {
  switch (status) {
    case 'applied':
      return 'success'; // green
    case 'inProgress':
      return 'warning'; // yellow
    case 'rejected':
      return 'error'; // red
    default:
      return 'info'; // blue or any other color for other statuses
  }
};

export default function UserTableRow({
  position,
  company,
  date,
  status,
  handleClick,
}) {
  const [open, setOpen] = useState(null);

  const handleOpenMenu = (event) => {
    setOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  return (
    <>
      <TableRow hover tabIndex={-1}>
        <TableCell>
        </TableCell>

        <TableCell component="th" scope="row" padding="none">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="subtitle2" noWrap title={position}>
              {position.length > 17 ? `${position.slice(0, 18)}...` : position}
            </Typography>
          </Stack>
        </TableCell>

        <TableCell>{company}</TableCell>

        <TableCell>{date}</TableCell>
        <TableCell>
          <Label color={getStatusColor(status)}>{status}</Label>
        </TableCell>


      </TableRow>

    </>
  );
}

