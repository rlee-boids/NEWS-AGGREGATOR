import { EventEmitter } from 'events';
import { getAllSubscriptions } from '../models/subscriptionModel';
import sendNotification from '../utils/notificationService';

const newsEventEmitter = new EventEmitter();

// Set number of listeners
newsEventEmitter.setMaxListeners(50);

// Listener for the 'newArticle' event
newsEventEmitter.on('newArticle', async (article) => {
    const subscriptions = await getAllSubscriptions();
  
    for (const [userId, { states, topics }] of Object.entries(subscriptions)) {
      const isStateMatched = states.includes(article.state);
      const isTopicMatched = article.topic.split(',').some((topic: string) => topics.includes(topic));
  
      if (isStateMatched || isTopicMatched) {
        console.log(`Notifying user ${userId}, there is new article: ${article.title}`);
        await sendNotification(userId, article); 
      }
    }
  });

export default newsEventEmitter;
