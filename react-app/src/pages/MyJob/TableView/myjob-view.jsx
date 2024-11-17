import { useState } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import TableNoData from './table-no-data';
import UserTableRow from './user-table-row';
import UserTableHead from './user-table-head';
import UserTableToolbar from './user-table-toolbar';
import { applyFilter, getComparator } from './utils';

const categorizeStatus = (status) => {
  const categories = {
    applied: ["Application sent", "Application submitted", "Application Received", "Received", "Application Completed", "Applied",],
    rejected: ["Rejected", "Application Rejected", "Application Declined", "application declined", "Not Accepted", "Not Selected", "Not considered", "Application not taken into further consideration", "Application did not meet the requirements", "Your application has been reviewed for this position and while your profile is interesting, we have decided to pursue other candidates.", "Not able to move forward in the recruiting process with you", "rejected", "Not able to move forward in the recruiting process"],
    inProgress: ["Application under review", "Under Review", "Your application has been received and is under review", "successfully submitted application, pending review", "We will be in contact with you as soon as possible.", "Application received and under review", "Application submitted, waiting for response", "successfully submitted application, pending review"],
    interviewsGiven: ["you have been selected for next round", "selected"],
  };

  for (const category in categories) {
    if (categories[category].includes(status)) {
      return category;
    }
  }
  return "applied";
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};


export default function UserPage(props) {
  const { myJobData } = props;
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState('name');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleSort = (event, id) => {
    const isAsc = orderBy === id && order === 'asc';
    if (id !== '') {
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(id);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const handleFilterByName = (event) => {
    setPage(0);
    setFilterName(event.target.value);
  };

  const myJobUsers = myJobData.map((item) => ({
    id: item.id,
    position: item.position,
    company: item.company,
    date: formatDate(item.date),
    status: categorizeStatus(item.status), // Simplifying the status
  }));


  const dataFiltered = applyFilter({
    inputData: myJobUsers,
    comparator: getComparator(order, orderBy),
    filterName,
  });
  const notFound = !dataFiltered.length && !!filterName;


  return (
    <Container>
      <Card>
        <UserTableToolbar
          numSelected={selected.length}
          filterName={filterName}
          onFilterName={handleFilterByName}
        />

        <TableContainer sx={{ overflow: 'unset' }}>
          <Table sx={{ minWidth: 200 }}>
            <UserTableHead
              order={order}
              orderBy={orderBy}
              rowCount={myJobData.length}
              numSelected={selected.length}
              onRequestSort={handleSort}
              headLabel={[
                { id: 'position', label: 'Position' },
                { id: 'company', label: 'Company' },
                { id: 'date', label: 'Date'},
                { id: 'status', label: 'Status' },
              ]}
            />
            <TableBody>
              {dataFiltered
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <UserTableRow
                    key={row.id}
                    position={row.position}
                    company={row.company}
                    date={row.date}
                    status={row.status}
                  />
                ))}
              {notFound && <TableNoData query={filterName} />}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          page={page}
          component="div"
          count={myJobData.length}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          rowsPerPageOptions={[5, 10, 25]}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>
    </Container>
  );
}
