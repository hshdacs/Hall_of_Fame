export const handleApiError = (error) => {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.log("here in errorrr------------>")
      console.error('Network error. Please check your internet connection.');
    } else {
      console.error('An error occurred during the API call:', error.message);
    }
  
    // You can add additional logic or UI feedback here based on your application's requirements.
  };