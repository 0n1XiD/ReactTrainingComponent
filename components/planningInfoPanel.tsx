import React, {useState} from 'react';
import {Grid, Paper, Typography, Icon, SvgIcon} from '@mui/material';
import {withStyles} from '@material-ui/styles';
import {createStyles, WithStyles} from '@material-ui/core';
import {StyleRules} from '@material-ui/styles/withStyles';
import '../themes/fonts/default';

import {data} from './institutions.js'
import MonthCell from './monthCell'

import {ReactComponent as ReplayIcon} from '../assets/img/svg/replay.svg';
import {ReactComponent as MenuIcon} from '../assets/img/svg/menu.svg';


interface Insurance {
    name: string;
    count: number;
}

interface Month {
    id: number;
    monthId: number;
    count: number;
    institutionId: number
}

interface TotalPatients {
    total: () => number;
    residue: () => number;
    insurances: { [name: string]: Insurance };
    months: () => Month[];
    allMonths: Month[];
}

const totalPatientsArr: TotalPatients = {
    total: () => {
        let sum = 0;
        for (let key in totalPatientsArr.insurances)
            sum += totalPatientsArr.insurances[key].count;
        return sum;
    },
    residue: () => {
        let sum = 0;
        let months = totalPatientsArr.months();
        for (let key in months)
            sum += months[key].count;
        return totalPatientsArr.total() - sum;
    },
    insurances: {},
    months: () => {
        let obj: { [key: string]: Month } = {};
        totalPatientsArr.allMonths.forEach(month => {
            const {monthId, count} = month;
            obj[monthId] = {
                id: 0,
                monthId,
                count: obj[monthId] ? count + obj[monthId].count : count,
                institutionId: 0
            };
        });
        const arr = Object.values(obj);
        return arr;
    },
    allMonths: []
};

data.forEach(institution => {
    institution.insurances.forEach(insurance => {
        totalPatientsArr.insurances[insurance.name] = {
            name: insurance.name,
            count: totalPatientsArr.insurances[insurance.name]
                ? insurance.patientCount + totalPatientsArr.insurances[insurance.name].count
                : insurance.patientCount
        };
    });
    institution.months.forEach((month: any) => {
        month['institutionId'] = institution.id;
        totalPatientsArr.allMonths.push(month);
    });
});

let localMonths = [
    {id: 1, name: 'Янв'},
    {id: 2, name: 'Фев'},
    {id: 3, name: 'Март'},
    {id: 4, name: 'Апр'},
    {id: 5, name: 'Май'},
    {id: 6, name: 'Июнь'},
    {id: 7, name: 'Июль'},
    {id: 8, name: 'Авг'},
    {id: 9, name: 'Сен'},
    {id: 10, name: 'Окт'},
    {id: 11, name: 'Нояб'},
    {id: 12, name: 'Дек'},
]


function getInstitutionResidue(institution_id: number): number {
    let patientMonthOverall = totalPatientsArr.allMonths.filter(
        obj => obj.institutionId === institution_id).reduce((accumulator, currentItem
    ) => accumulator + currentItem.count, 0)
    let desiredObject = data.find(obj => obj.id === institution_id)
    if (desiredObject) {
        let patientInsuranceOverall = desiredObject.insurances.reduce(
            (accumulator, currentItem) => accumulator + currentItem.patientCount, 0
        )
        return patientInsuranceOverall - patientMonthOverall
    }
    return 0
}

const PlanningInfoPanel: React.FC<WithStyles> = props => {
    const {classes} = props;

    const [totalPatients, setData] = useState<TotalPatients>(totalPatientsArr);

    let filtered = false
    const panelFilter = (id: number) => {
        const element = document.getElementById(`panel-info-edit-${id}`)
        if (element) {
            let currentStyle = element.style.display
            if (filtered && currentStyle === 'block') {
                setPanelsDisplay('block')
            } else {
                setPanelsDisplay('none')
                element.style.display = 'block'
            }
        }
    };

    const setPanelsDisplay = (display: string, showAll = false) => {
        filtered = showAll || display === 'block' ? false : true
        document.querySelectorAll<HTMLElement>('[data-name="panel-info-edit"]').forEach(element => {
            element.style.display = display
        });
        document.querySelectorAll<HTMLElement>('[data-name="institution-name"]').forEach(element => {
            element.style.color = display === 'block' ? '#000000' : '#059669'
        });
    }

    const allMonths = totalPatients.months()

    const patientMonthOnInput = (e: React.FormEvent<HTMLSpanElement>, institution_id: number, month_id: number) => {
        let desiredObject;
        const monthNumber = Number(e.currentTarget.getAttribute('data-monthId'))
        desiredObject = month_id === 0 ?
            totalPatientsArr.allMonths.find(
                obj => obj.monthId === monthNumber && obj.institutionId === institution_id
            ) :
            totalPatientsArr.allMonths.find(obj => obj.id === month_id)

        if (desiredObject) {
            desiredObject.count = Number(e.currentTarget.innerHTML)
        } else {
            totalPatientsArr.allMonths.push({
                id: 0,
                monthId: monthNumber,
                count: Number(e.currentTarget.innerHTML),
                institutionId: institution_id
            })
        }
        redrawMonths()
    }

    function redrawMonths() {
        const updatedData = {...totalPatientsArr, property: 'months'};
        setData(updatedData);
    }

    function clearLocalData(institution_id: number) {
        totalPatientsArr.allMonths.filter(obj => obj.institutionId === institution_id && obj.id === 0).forEach(month => {
            month.count = 0
        })
        document.querySelectorAll<HTMLElement>(`[data-name="month-input-${institution_id}-0"]`).forEach(element => {
            element.innerHTML = ''
        });
        redrawMonths()
    }

    function distributeRestCells(institution_id: number) {

        const residue = getInstitutionResidue(institution_id)

        let inputs = Array.from(
            document.querySelectorAll<HTMLElement>(`[data-name="month-input-${institution_id}-0"]`)
        )
        if (inputs.length > 0) {
            inputs = inputs.filter((obj: HTMLElement) => !obj.innerHTML)
            let part = Math.floor(residue / inputs.length)
            if (inputs.length > 0) {
                let firstEl = true
                inputs.forEach((element: HTMLElement) => {
                    element.innerHTML = firstEl ? String(part + residue % inputs.length) : String(part)
                    totalPatientsArr.allMonths.push({
                        id: 0,
                        monthId: Number(element.getAttribute('data-monthId')),
                        count: Number(element.innerHTML),
                        institutionId: institution_id
                    })
                    firstEl = false
                });
            }
        }
        redrawMonths()
    }

    return (
        <Grid container className={classes.panelInfoComponent} spacing={'16'}>
            <Grid item id={'panelInfoComponentItem'} className={classes.panelInfoComponentItem}>
                <Grid container direction='column' spacing={'16'}>
                    <Grid item>
                        <Paper className={classes.panelInfoOverall} onClick={() => setPanelsDisplay('block', true)}>
                            <Grid container direction='column' spacing={'16'}>
                                <Grid item container justifyContent={'space-between'}>
                                    <Grid item>
                                        <Typography fontSize={14} fontWeight={700}>
                                            Общее количество пациентов
                                        </Typography>
                                    </Grid>
                                    <Grid item>
                                        <Typography fontSize={14} fontWeight={700}>
                                            Всего: {totalPatients.total()}
                                        </Typography>
                                    </Grid>
                                </Grid>
                                {Object.entries(totalPatients.insurances).map(([name, insurance]) => (
                                    <Grid item>
                                        <Grid container justifyContent={'space-between'}>
                                            <Grid item>
                                                <Typography fontSize={14}>
                                                    {name}
                                                </Typography>
                                            </Grid>
                                            <Grid item>
                                                <Typography fontSize={14}>
                                                    {insurance.count}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>
                    </Grid>
                    {data.map((institution, institutionIndex) => (
                        <Grid item>
                            <Paper
                                className={classes.panelInfoOverall}
                                onClick={() => panelFilter(institution.id)}
                            >
                                <Grid container direction='column' spacing={'16'}>
                                    <Grid item>
                                        <Grid container justifyContent={'space-between'}>
                                            <Grid item>
                                                <Typography fontSize={14} fontWeight={700}>
                                                    {institution.name}
                                                </Typography>
                                            </Grid>
                                            <Grid item>
                                                <Typography fontSize={14} fontWeight={700}>
                                                    Всего: {institution.insurances.reduce(
                                                    (sum, insurance) => sum + insurance.patientCount, 0)
                                                }
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                    {institution.insurances.map((insurance, insuranceIndex) => (
                                        <Grid item>
                                            <Grid container justifyContent={'space-between'}>
                                                <Grid item>
                                                    <Typography fontSize={14}>
                                                        {insurance.name}
                                                    </Typography>
                                                </Grid>
                                                <Grid item>
                                                    <Typography fontSize={14}>
                                                        {insurance.patientCount}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Grid>
            <Grid item className={classes.panelInfoComponentItem} width={'auto'} flexGrow={1}>
                <Grid container direction='column' spacing={'16'} >
                    <Grid item>
                        <Paper className={classes.panelInfoEdit}>
                            <Grid container direction='column' spacing={'16'} >
                                <Grid item>
                                    <Grid container direction={'column'} spacing={'14.5'}>
                                        <Grid item>
                                            <Grid container justifyContent={'space-between'}>
                                                <Grid item>
                                                    <Typography fontSize={16} fontWeight={700}>
                                                        Общее количество пациентов
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                        <Grid item display={{xs: 'flex'}} alignItems={{xs: 'center'}} justifyContent={{xs: 'center'}}>
                                            <Grid container xs={7} xl={16} spacing={{xs:'8', xl: '14'}} justifyContent={{xs: 'center'}} alignItems={{xs: 'center'}}>
                                                {localMonths.map((month, monthIndex) => (
                                                    <Grid item>
                                                        <Grid container direction={'column'} spacing={'14'}
                                                              alignItems={'center'}>
                                                            <Grid item>
                                                                <Typography fontSize={14} fontWeight={400}>
                                                                    {month.name}
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item>
                                                                <Paper elevation={0}
                                                                       className={classes.patientCountBlock}>
                                                                    <Typography fontSize={14} fontWeight={400}>
                                                                        {allMonths.map((monthTotal) => (
                                                                            monthTotal.monthId === month.id ? monthTotal.count : null
                                                                        ))}
                                                                    </Typography>
                                                                </Paper>
                                                            </Grid>
                                                        </Grid>
                                                    </Grid>
                                                ))}
                                                <Grid item marginLeft={{xs:'0', xl:'11.5px'}}>
                                                    <Grid container direction={'column'} spacing={'14'}
                                                          alignItems={'center'}>
                                                        <Grid item>
                                                            <Typography color={'#395882'} fontSize={14}
                                                                        fontWeight={400}>
                                                                Остаток
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item>
                                                            <Paper elevation={0}
                                                                   className={classes.patientCountBlockRemainder}>
                                                                <Typography fontSize={14} fontWeight={400}>
                                                                    {totalPatients.residue()}
                                                                </Typography>
                                                            </Paper>
                                                        </Grid>
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                    {data.map((institution, institutionIndex) => (
                        <Grid item data-name={'panel-info-edit'} id={`panel-info-edit-${institution.id}`}>
                            <Paper className={classes.panelInfoEdit}>
                                <Grid container direction='column' spacing={'16'}>
                                    <Grid item>
                                        <Grid container direction={'column'} spacing={'14.5'} >
                                            <Grid item>
                                                <Grid container justifyContent={'space-between'} >
                                                    <Grid item>
                                                        <Typography
                                                            data-name={'institution-name'}
                                                            fontSize={16}
                                                            fontWeight={700}
                                                        >
                                                            {institution.name}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item>
                                                        <Grid container spacing={'14'}>
                                                            <Grid item onClick={() => clearLocalData(institution.id)}>
                                                                <Icon>
                                                                    <SvgIcon
                                                                        className={classes.icon}
                                                                        component={ReplayIcon}
                                                                        viewBox="8 8 24 24"
                                                                    />
                                                                </Icon>
                                                            </Grid>
                                                            <Grid item
                                                                  onClick={() => distributeRestCells(institution.id)}>
                                                                <Icon>
                                                                    <SvgIcon
                                                                        className={classes.icon}
                                                                        component={MenuIcon}
                                                                        viewBox="8 8 24 24"
                                                                    />
                                                                </Icon>
                                                            </Grid>
                                                        </Grid>
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                            <Grid item display={{xs: 'flex'}} alignItems={{xs: 'center'}} justifyContent={{xs: 'center'}}>
                                                <Grid container xs={7} xl={16} spacing={{xs:'8', xl: '14'}} alignItems={{xs: 'center'}} justifyContent={{xs: 'center'}}>
                                                    {localMonths.map((month, monthIndex) => (
                                                        <Grid item>
                                                            <Grid container direction={'column'} spacing={'14'}
                                                                  alignItems={'center'}>
                                                                <Grid item>
                                                                    <Typography fontSize={14} fontWeight={400}>
                                                                        {month.name}
                                                                    </Typography>
                                                                </Grid>
                                                                <Grid item>
                                                                    <MonthCell
                                                                        month={month}
                                                                        institution={institution}
                                                                        onInput={patientMonthOnInput}
                                                                    />
                                                                </Grid>
                                                            </Grid>
                                                        </Grid>
                                                    ))}
                                                    <Grid item marginLeft={{xs:'0', xl:'11.5px'}}>
                                                        <Grid container direction={'column'} spacing={'14'}
                                                              alignItems={'center'}>
                                                            <Grid item>
                                                                <Typography color={'#395882'} fontSize={14}
                                                                            fontWeight={400}>
                                                                    Остаток
                                                                </Typography>
                                                            </Grid>
                                                            <Grid item>
                                                                <Paper elevation={0}
                                                                       className={classes.patientCountBlockRemainder}>
                                                                    <Typography fontSize={14} fontWeight={400}>
                                                                        {getInstitutionResidue(institution.id)}
                                                                    </Typography>
                                                                </Paper>
                                                            </Grid>
                                                        </Grid>
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Grid>
        </Grid>
    );
};

const styles = (): StyleRules => {
    return createStyles({
        panelInfoComponent: {
            width: '100%',
            background: '#F9F8F6',
            padding: '0 20px'
        },
        panelInfoComponentItem: {
            overflowY: 'scroll',
            paddingBottom: '16px',
            maxHeight: '60vh',
            '&::-webkit-scrollbar': {
                width: '0.4em',
                backgroundColor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'transparent',
            },
        },
        panelInfoOverall: {
            cursor: 'pointer',
            maxWidth: '495px',
            width: '495px',
            padding: '16px 24px 16px 24px',
            transition: 'background 0.3s',
            '&:hover': {
                background: '#D1FAE5',
            },
        },
        panelInfoEdit: {
            padding: '16px 24px 16px 24px',
        },
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
        patientCountBlockRemainder: {
            background: '#DBEAFF !important',
            width: '66px',
            height: '48px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        },
        icon: {
            cursor: 'pointer',
            marginRight: '6px',
        },
        '@media (max-width: 1630px)': {
            panelInfoComponent: {
                background: '#F9F8F6',
                width: '100%',
                marginBottom: '15px'
            },
            panelInfoComponentItem: {
                width: '100%',
                overflowY: 'none',
                padding: '5px 20px',
                maxHeight: '100%',
            },
            panelInfoEdit: {
                maxWidth: 'calc(100% - 20px)',
                width: '100%',
                padding: '24px 12px 12px 24px',
            },
            panelInfoOverall: {
                maxWidth: 'calc(100% - 20px)',
                width: '100%',
                padding: '24px 12px 12px 24px',
            },
        },
        '@media (max-width: 596px)': {
            panelInfoEdit: {
                padding: '16px 12px 12px 16px',
            },
            panelInfoOverall: {
                padding: '16px 12px 12px 16px',
            },
        },
    });
};

export default withStyles(styles)(PlanningInfoPanel);
