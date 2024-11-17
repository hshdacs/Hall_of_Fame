import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import AppWidgetSummary from './MyJobWidgetSummary.jsx';
import AppCurrentVisits from './MyJobCurrentVisits.jsx';
import MyJobView from './TableView/myjob-view.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faCircleXmark, faEnvelopesBulk, faListCheck } from '@fortawesome/free-solid-svg-icons'

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

const calculateCategorizedStatusCounts = (data) => {
  let Applied = 0;
  let Rejected = 0;
  let InProgress = 0;
  let Interviews = 0;
  data.forEach((item) => {
    const status = item.status;
    const category = categorizeStatus(status);
    switch (category) {
      case "applied":
        Applied++;
        break;
      case "rejected":
        Rejected++;
        break;
      case "inProgress":
        InProgress++;
        break;
      case "interviewsGiven":
        Interviews++;
        break;
      default:
        break;
    }
  });


  const summary = {
    Applied,
    InProgress,
    Interviews,
    Rejected,
  };

  return summary;
};

export default function MyJob(props) {
  const { myJobData } = props;
  const result = calculateCategorizedStatusCounts(myJobData);
  const chartData = Object.keys(result).map((category) => ({
    label: category,
    value: result[category],
  }));

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 5 }}>
      </Typography>

      <Grid container spacing={1}>
        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Applied Applications"
            total={result.Applied}
            color="success"
            icon={
              <FontAwesomeIcon icon={faEnvelopesBulk} size="2x" beat />}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Application progress"
            total={result.InProgress}
            color="info"
            icon={
              <FontAwesomeIcon icon={faListCheck} size="2x" flip />}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Interviews Given"
            total={result.Interviews}
            color="warning"
            icon={<FontAwesomeIcon icon={faCalendarCheck} size="2x" bounce />}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AppWidgetSummary
            title="Rejection"
            total={result.Rejected}
            color="error"
            icon={<FontAwesomeIcon icon={faCircleXmark} size="2x" beat />}
          />
        </Grid>

        <Grid xs={12} md={6} lg={8}>
          <MyJobView myJobData={myJobData} />
        </Grid>

        <Grid xs={12} md={6} lg={4}>
          <AppCurrentVisits
            title="Application Status"
            chart={{
              series: chartData,
            }}
          />
        </Grid>
      </Grid>
    </Container>
  );
};





