export interface Comment {
  id: string;
  comment: string;
  userId: string | null;
  userEmail?: string | null;
}

export interface Post {
  id: string;                    
  title: string;
  content: string;
  imagePath: string;               
  creator?: string | null;
  creatorEmail?: string;
  comments: Comment[]; 
  timestamp?: number;  
  reactions?: {
    userId: string;
    userEmail: string;
  }[];   
  
  reacted?: boolean;         // whether the user has reacted to the post
  reactionCount?: number; 
}
