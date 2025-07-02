import {DatePicker, LocalizationProvider} from "@mui/x-date-pickers";
import {FocusEventHandler, useState} from "react";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import {Box, ClickAwayListener, Paper, Popper, TextField} from "@mui/material";
import {Dayjs} from "dayjs";

const DateRangePicker = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleFocus: FocusEventHandler<HTMLInputElement> = (event) => {
    setAnchorEl(event.currentTarget);
    setIsOpen(true);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setIsOpen(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box display={'flex'} alignItems={'center'}>
        <DatePicker
          label={'시작일'}
          value={startDate}
          onChange={value => setStartDate(value)} />
        <Box mx={1}>-</Box>
        <DatePicker
          label={'종료일'}
          minDate={startDate}
          value={endDate}
          onChange={value => setEndDate(value)} />
      </Box>
    </LocalizationProvider>
  );
};

export default DateRangePicker;
