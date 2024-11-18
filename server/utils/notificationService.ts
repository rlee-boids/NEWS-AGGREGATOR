const sendNotification = async (userId: string, article: { title: any; }) => {
    // TODO: add any type of notification you want
    console.log(`Notification sent to user ${userId} for article: ${article.title}`);
  };
  
  export default sendNotification;