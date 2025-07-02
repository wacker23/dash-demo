import React, { useCallback, useMemo, useState } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
import {alpha} from '@mui/material/styles';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { visuallyHidden } from '@mui/utils';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import { Button, Collapse, FormControl, InputLabel } from '@mui/material';

interface DataField {
  [key: string]: any;
}

interface Row extends DataField {
  id: number;
  renderEdit?: () => JSX.Element;
  onDelete?: (id: number) => void;
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

type Order = 'asc' | 'desc';

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key
): (
  a: { [key in Key]: number | string },
  b: { [key in Key]: number | string },
) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// Since 2020 all major browsers ensure sort stability with Array.prototype.sort().
// stableSort() brings sort stability to non-modern browsers (notably IE11). If you
// only support modern browsers you can replace stableSort(exampleArray, exampleComparator)
// with exampleArray.slice().sort(exampleComparator)
function stableSort<T>(array: readonly T[], comparator: (a: T, b: T) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

interface Column {
  id: keyof DataField;
  label: string;
  disablePadding?: boolean;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  formatter?: (value: any) => any;
}

interface EnhancedTableHeadProps {
  isActionButtons: boolean;
  numSelected: number;
  cols: readonly Column[];
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof DataField) => void;
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  order: Order;
  orderBy: keyof DataField;
  rowCount: number;
}

const EnhancedTableHead = (props: EnhancedTableHeadProps) => {
  const {
    isActionButtons,
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
  } = props;
  const createSortHandler = (property: keyof Row) => (event: React.MouseEvent<unknown>) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{
              'aria-label': 'select all desserts',
            }}
          />
        </TableCell>
        {props.cols.map((col) => (
          <TableCell
            sx={{ pl: 5 }}
            key={col.id}
            align={col.align ?? 'center'}
            padding={col.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === col.id ? order : false}>
            <TableSortLabel
              active={orderBy === col.id}
              direction={orderBy === col.id ? order : 'asc'}
              onClick={createSortHandler(col.id)}>
              {col.label}
              {orderBy === col.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
        {isActionButtons && <TableCell />}
      </TableRow>
    </TableHead>
  )
}

interface EnhancedTableToolbarProps {
  isCreate?: boolean;
  numSelected: number;
  cols: readonly Column[];
  createLabel?: string;
  onCreate?: () => void;
  onSearch?: (searchColumn: keyof DataField, searchValue: string) => void;
  onDelete?: () => void;
}

const EnhancedTableToolbar = (props: EnhancedTableToolbarProps) => {
  const {
    numSelected,
    cols,
    createLabel,
    onCreate,
    onSearch,
    onDelete,
  } = props;
  const [searchColumn, setSearchColumn] = useState<keyof DataField>(cols[0].id);
  const [searchValue, setSearchValue] = useState<string>('');
  const isCreate = props.isCreate ?? false;

  const handleCreateClick = () => {
    if (onCreate) {
      onCreate();
    }
  }

  const handleSearchColumnChange = (event: SelectChangeEvent<unknown>) => {
    setSearchColumn(event.target.value as keyof DataField);
    if (onSearch) {
      onSearch(event.target.value as keyof DataField, searchValue);
    }
  }

  const handleSearchValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
    if (onSearch) {
      onSearch(searchColumn, event.target.value);
    }
  }

  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
        }),
      }}>
      {numSelected > 0 ? (
        <Typography
          sx={{ flex: '1 1 100%' }}
          color={'inherit'}
          variant={'subtitle1'}
          component={'div'}>
          {numSelected}행 선택됨
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mr: 'auto',
          }}>
          {isCreate && (
            <Button variant={'contained'} onClick={handleCreateClick}>
              {createLabel ?? '행 추가'}
            </Button>
          )}
        </Box>
      )}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mr: 2,
        }}>
        <FormControl
          variant={'standard'}
          sx={{ minWidth: 180 }}>
          <InputLabel id={'filter-select-label'}>
            검색 항목
          </InputLabel>
          <Select
            labelId={'filter-select-label'}
            id={'filter-select'}
            sx={{ mr: 1, textAlign: 'right' }}
            value={searchColumn}
            onChange={handleSearchColumnChange}>
            {cols.map((col) => (
              <MenuItem
                key={col.id}
                value={col.id}>
                {col.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          sx={{ minWidth: 180 }}
          label={'검색어'}
          placeholder={'검색어'}
          type={'search'}
          variant={'standard'}
          value={searchValue}
          onChange={handleSearchValueChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position={'start'}>
                <SearchIcon />
              </InputAdornment>
            )
          }} />
      </Box>
      {numSelected > 0 ? (
        <Tooltip title={'Delete'}>
          <IconButton onClick={onDelete}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <>
          {/*<Tooltip title={'Filter list'}>*/}
          {/*  <IconButton>*/}
          {/*    <FilterListIcon />*/}
          {/*  </IconButton>*/}
          {/*</Tooltip>*/}
        </>
      )}
    </Toolbar>
  )
}

interface EnhancedTableRowProps {
  isItemSelected: boolean;
  renderEdit?: () => JSX.Element;
  row: Row;
  cols: readonly Column[];
  onClick?: (id: number) => void;
}

const EnhancedTableRow = (props: EnhancedTableRowProps) => {
  const {
    isItemSelected,
    row,
    cols,
    onClick,
  } = props;
  const [open, setOpen] = useState(false);
  const rowId = row.id;
  const labelId = `table-checkbox-${rowId}`;
  const {onDelete} = row;

  const handleClick = (event: React.MouseEvent<unknown>, id: number) => {
    if (onClick) {
      onClick(row.id);
    }
  }

  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(rowId);
    }
  }, [onDelete, rowId]);

  const isActionButtons = row.renderEdit !== undefined || row.onDelete !== undefined;

  return (
    <>
      <TableRow
        hover
        role="checkbox"
        aria-checked={isItemSelected}
        tabIndex={-1}
        key={rowId}
        selected={isItemSelected}
        sx={{
          cursor: 'pointer',
        }}>
        <TableCell
          sx={row.renderEdit !== undefined ? { borderBottom: 'none' } : undefined}
          onClick={(event) => handleClick(event,rowId)}
          padding="checkbox">
          <Checkbox
            color="primary"
            checked={isItemSelected}
            inputProps={{
              'aria-labelledby': labelId,
            }}
          />
        </TableCell>
        {cols.map((col, index) => {
          const columnId = col.id as string;
          return (
            <TableCell
              sx={row.renderEdit !== undefined ? { borderBottom: 'none' } : undefined}
              key={`table-${columnId}-${rowId}`}
              onClick={(event) => handleClick(event, rowId)}
              align={col.align ?? 'center'}
              id={index === 0 ? labelId : undefined}
              scope={index === 0 ? 'row' : undefined}
              padding={index === 0 ? 'none' : undefined}>
              {col.formatter ? col.formatter(row[columnId]) : row[columnId]}
            </TableCell>
          );
        })}
        {isActionButtons && (
          <TableCell
            sx={row.renderEdit !== undefined ? { borderBottom: 'none' } : undefined}
            align={'center'}
            padding={'none'}>
            {row.renderEdit !== undefined && (
              <IconButton
                sx={{ mx: 1 }}
                aria-label={'edit'}
                size={'small'}
                onClick={() => setOpen(!open)}>
                <EditIcon />
              </IconButton>
            )}
            {row.onDelete !== undefined && (
              <IconButton
                sx={{ mx: 1 }}
                aria-label={'delete-item'}
                size={'small'}
                onClick={handleDelete}>
                <DeleteIcon />
              </IconButton>
            )}
          </TableCell>
        )}
      </TableRow>
      {row.renderEdit !== undefined && (
        <TableRow>
          <TableCell
            sx={{ py: 0 }}
            colSpan={cols.length + 2}>
            <Collapse in={open} timeout={'auto'} unmountOnExit>
              <Box sx={{ m: 1, px: 5 }}>
                {row.renderEdit()}
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

interface EnhancedTableProps {
  cols: readonly Column[];
  createLabel?: string;
  rows: readonly Row[];
  searchColumns: (keyof DataField)[];
  defaultOrderBy?: keyof DataField;
  onBatchDelete?: (ids: readonly number[]) => void;
  renderCreate?: () => JSX.Element;
}

const EnhancedTable = (props: EnhancedTableProps) => {
  const {
    cols,
    createLabel,
    rows,
    searchColumns,
    defaultOrderBy,
    onBatchDelete,
    renderCreate,
  } = props
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof DataField>(defaultOrderBy ?? '');
  const [selected, setSelected] = useState<readonly number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [searchColumn, setSearchColumn] = useState<keyof DataField>('');
  const [openCreate, setOpenCreate] = useState(false);

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof DataField,
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      if (filterRows.length != rows.length) {
        const newSelected = filterRows.map((n) => n.id);
        setSelected(newSelected);
      } else {
        const newSelected = rows.map((n) => n.id);
        setSelected(newSelected);
      }
      return;
    }
    setSelected([]);
  };

  const handleClick = (id: number) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: readonly number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleBatchDelete = () => {
    if (onBatchDelete) {
      onBatchDelete(selected);
    }
  }

  const handleSearchValueChange = (column: keyof DataField, value: string) => {
    setSearchColumn(column);
    setSearchText(value);
  }

  const handleCreate = () => {
    setOpenCreate(!openCreate);
  }

  const isActionButtons = rows.some(
    row =>
      row.renderEdit !== undefined || row.onDelete !== undefined,
  );

  const getInitialConsonant = (str: string) => {
    const KOREAN_CONSONANT = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
    return str.split('').map(character => {
      const unicode = character.charCodeAt(0);
      if (unicode >= 44032 && unicode <= 55203) {
        return KOREAN_CONSONANT[Math.floor((unicode - 44032) / 588)];
      }
      return character;
    }).join('');
  }

  const isSelected = (id: number) => selected.indexOf(id) !== -1;

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  const filterRows = useMemo(
    () => {
      if (!searchColumn || !searchText) {
        return rows;
      }
      return rows.filter(row => {
        const cellValue = row[searchColumn].toString().toLowerCase();
        const initialConsonant = getInitialConsonant(cellValue);
        return cellValue.includes(searchText.toLowerCase()) || initialConsonant.includes(searchText.toLowerCase());
      });
    },
    [rows, searchColumn, searchText],
  );

  const visibleRows = useMemo(
    () =>
      stableSort(filterRows, getComparator(order, orderBy)).slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage,
      ),
    [filterRows, order, orderBy, page, rowsPerPage],
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%' }}>
        <EnhancedTableToolbar
          isCreate={renderCreate !== undefined}
          numSelected={selected.length}
          cols={cols.filter(column => searchColumns.includes(column.id as keyof DataField))}
          createLabel={createLabel}
          onCreate={handleCreate}
          onSearch={handleSearchValueChange}
          onDelete={handleBatchDelete} />
        {renderCreate !== undefined && (
          <Collapse in={openCreate} timeout={'auto'} unmountOnExit>
            <Box sx={{ m: 1, px: 5 }}>
              {renderCreate()}
            </Box>
          </Collapse>
        )}
        <TableContainer>
          <Table>
            <EnhancedTableHead
              isActionButtons={isActionButtons}
              numSelected={selected.length}
              cols={cols}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={rows.length} />
            <TableBody>
              {visibleRows.map((row, index) => {
                const rowId = row.id as number;
                const isItemSelected = isSelected(rowId);
                return (
                  <EnhancedTableRow
                    key={rowId}
                    isItemSelected={isItemSelected}
                    row={row as Row}
                    cols={cols}
                    onClick={handleClick} />
                );
              })}
              {emptyRows > 0 && (
                <TableRow sx={{
                  height: 53 * emptyRows,
                }}>
                  <TableCell colSpan={cols.length + (isActionButtons ? 2 : 1)} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component={'div'}
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage} />
      </Paper>
    </Box>
  );
}

export default EnhancedTable
