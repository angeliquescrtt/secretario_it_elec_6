import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { Post } from "./post.model";
import { HttpClient } from "@angular/common/http";
import { map } from "rxjs/operators";
import { Router } from "@angular/router";

@Injectable({ providedIn: "root" })
export class PostsService {
  private posts: Post[] = [];
  private postsUpdated = new Subject<{ posts: Post[]; postCount: number }>();

  constructor(private http: HttpClient, private router: Router) {}

  getPosts(pageSize: number, currentPage: number) {
    const queryParams = `?pageSize=${pageSize}&page=${currentPage}`;
    this.http
      .get<{ message: string; posts: any[]; maxPosts: number }>(
        "http://localhost:3000/api/posts" + queryParams
      )
      .pipe(
        map(postData => {
          return {
            posts: postData.posts.map(post => ({
              id: post.id,
              title: post.title,
              content: post.content,
              imagePath: post.imagePath,
              userId: post.userId,
              creator: post.creator,
              comments: post.comments || [],
            })),
            maxPosts: postData.maxPosts,
          };
        })
      )
      .subscribe(transformedPostsData => {
        this.posts = transformedPostsData.posts;
        this.postsUpdated.next({
          posts: [...this.posts],
          postCount: transformedPostsData.maxPosts,
        });
      });
  }

  getPostUpdatedListener() {
    return this.postsUpdated.asObservable();
  }

  getPost(id: string) {
    return this.http
      .get<{
        id: string;
        title: string;
        content: string;
        imagePath: string;
        creator: string;
        comments: any[];
      }>("http://localhost:3000/api/posts/" + id)
      .pipe(
        map(post => ({
          id: post.id,
          title: post.title,
          content: post.content,
          imagePath: post.imagePath,
          creator: post.creator,
          comments: post.comments || [],
        }))
      );
  }

  addPost(title: string, content: string, image: File) {
    const postData = new FormData();
    postData.append("title", title);
    postData.append("content", content);
    postData.append("image", image);

    this.http
      .post<{ message: string; post: any }>(
        "http://localhost:3000/api/posts",
        postData
      )
      .subscribe(response => {
        const newPost: Post = {
          id: response.post._id || response.post.id,
          title,
          content,
          imagePath: response.post.imagePath,
          creator: response.post.creator,
          comments: response.post.comments || [],
        };
        this.posts.push(newPost);
        this.postsUpdated.next({
          posts: [...this.posts],
          postCount: this.posts.length,
        });
        this.router.navigate(["/"]);
      });
  }

  updatePost(id: string, title: string, content: string, image: File | string) {
    let postData: FormData | Post;

    if (typeof image === "object") {
      postData = new FormData();
      postData.append("id", id);
      postData.append("title", title);
      postData.append("content", content);
      postData.append("image", image, image.name);
    } else {
      postData = {
        id,
        title,
        content,
        imagePath: image,
        creator: null,
        comments: [],
      };
    }

    this.http
      .put<{ message: string; imagePath: string; creator: string }>(
        "http://localhost:3000/api/posts/" + id,
        postData
      )
      .subscribe(response => {
        const updatedPosts = [...this.posts];
        const index = updatedPosts.findIndex(p => p.id === id);

        if (index !== -1) {
          updatedPosts[index] = {
            id,
            title,
            content,
            imagePath: response.imagePath || (typeof image === "string" ? image : ""),
            creator: response.creator || updatedPosts[index].creator,
            comments: updatedPosts[index].comments || [],
          };
          this.posts = updatedPosts;
          this.postsUpdated.next({
            posts: [...this.posts],
            postCount: this.posts.length,
          });
          this.router.navigate(["/"]);
        }
      });
  }

  deletePost(postId: string) {
    return this.http.delete(`http://localhost:3000/api/posts/${postId}`);
  }

  addComment(postId: string, commentText: string) {
    const comment = { comment: commentText };

    return this.http
      .post<{ message: string; comments: any[] }>(
        `http://localhost:3000/api/posts/${postId}/comments`,
        comment
      )
      .pipe(
        map(response => {
          // Update the post's comments locally after successful addition
          const updatedPosts = [...this.posts];
          const postIndex = updatedPosts.findIndex(post => post.id === postId);
          if (postIndex !== -1) {
            updatedPosts[postIndex].comments = response.comments;
          }
          this.posts = updatedPosts;
          this.postsUpdated.next({
            posts: [...this.posts],
            postCount: this.posts.length,
          });
          return response;
        })
      );
  }

  addReaction(postId: string) {
    return this.http.post<{ reactions: any[] }>(
      `http://localhost:3000/api/posts/${postId}/react`,
      {}
    );
  }




  getComments(postId: string) {
    return this.http.get<{ message: string; comments: any[] }>(
      `http://localhost:3000/api/posts/${postId}/comments`
    );
  }

  updateComment(postId: string, commentId: string, commentText: string) {
    return this.http.put<{ message: string }>(
      `http://localhost:3000/api/posts/${postId}/comments/${commentId}`,
      { comment: commentText }
    );
  }

  deleteComment(postId: string, commentId: string) {
    return this.http.delete<{ message: string }>(
      `http://localhost:3000/api/posts/${postId}/comments/${commentId}`
    );
  }

 

removeReaction(postId: string, userId: string) {
  return this.http.post(`http://localhost:3000/api/posts/${postId}/react`, { action: 'remove', userId });
}

  toggleReaction(postId: string) {
  return this.http.post<{ reactions: any[] }>(`http://localhost:3000/api/posts/${postId}/react`, {});
}

}
