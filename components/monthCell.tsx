import React, {useState} from 'react';
import {Grid, Paper, Typography, Icon, SvgIcon} from '@mui/material';
import {withStyles} from '@material-ui/styles';
import {createStyles, WithStyles} from '@material-ui/core';
import {StyleRules} from '@material-ui/styles/withStyles';
import '../themes/fonts/default';


interface ServerMonth {
    id: number;
    monthId: number;
    count: number;
}

function getMonthData(monthId: number, months: ServerMonth[]): { id: number; count: number } {
    let data = { id: 0, count: 0 };

    months.forEach((month) => {
        if (month.monthId === monthId) {
            data.id = month.id;
            data.count = month.count;
        }
    });

    return data;
}

interface MonthCellProps extends WithStyles {
    month: any;
    institution: any;
    onInput: any;
}

const MonthCell: React.FC<MonthCellProps> = ({ month, institution, onInput, classes, }) => {

    const monthData = getMonthData(month.id, institution.months)
    return (
        <Paper elevation={0}
               className={classes.patientCountBlock}>
            <Typography
                className={monthData.id === 0 ? classes.patientCountBlockInput : ''}
                contentEditable={monthData.id === 0}
                data-name={`month-input-${institution.id}-${monthData.id}`}
                data-monthId={month.id}
                fontSize={14}
                fontWeight={400}
                onInput={(event) => onInput(event, institution.id, monthData.id)}
            >
                {monthData.count === 0 ? '' : monthData.count}
            </Typography>
        </Paper>
    );
};

const styles = (): StyleRules => {
    return createStyles({
        patientCountBlock: {
            background: '#F9F8F6  !important',
            width: '66px',
            height: '48px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        },
        patientCountBlockInput: {
            width: '46px',
            height: '25px',
            textAlign: 'center',
            borderBottom: '2px solid #059669',
            outline: `0 solid transparent`
        },
    });
};

export default withStyles(styles)(MonthCell);
