import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { Post } from "./post.model";
import { HttpClient } from "@angular/common/http";
import { map } from "rxjs/operators";
import { Router } from "@angular/router";

@Injectable({ providedIn: "root" })
export class PostsService {
  private posts: Post[] = [];
  private postsUpdated = new Subject<Post[]>();

  constructor(private http: HttpClient, private router: Router) {}

  getPosts() {
    this.http
      .get<{ message: string; posts: any }>("http://localhost:3000/api/posts")
      .pipe(
        map((postData) => {
          return postData.posts.map((post: any) => ({
            id: post._id,
            title: post.title,
            content: post.content,
            imagePath: post.imagePath,
          }));
        })
      )
      .subscribe((transformedPosts) => {
        this.posts = transformedPosts;
        this.postsUpdated.next([...this.posts]);
      });
  }

  getPostUpdatedListener() {
    return this.postsUpdated.asObservable();
  }

  getPost(id: string) {
    return this.http.get<{ _id: string; title: string; content: string; imagePath: string }>(
      "http://localhost:3000/api/posts/" + id
    );
  }

  addPost(title: string, content: string, image: File) {
    const postData = new FormData();
    postData.append("title", title);
    postData.append("content", content);
    postData.append("image", image);

    this.http.post<{ message: string; post: Post }>("http://localhost:3000/api/posts", postData).subscribe((response) => {
      const newPost: Post = {
        id: response.post.id,
        title: title,
        content: content,
        imagePath: response.post.imagePath,
      };
      this.posts.push(newPost);
      this.postsUpdated.next([...this.posts]);
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
      postData = { id, title, content, imagePath: image };  
    }
  
    this.http.put<{ message: string; imagePath?: string }>(
      "http://localhost:3000/api/posts/" + id,
      postData
    ).subscribe((response) => {
      const updatedPosts = [...this.posts];
      const index = updatedPosts.findIndex((p) => p.id === id);
      
      if (index !== -1) {
        updatedPosts[index] = {
          id,
          title,
          content,
          imagePath: response.imagePath || (typeof image === "string" ? image : updatedPosts[index].imagePath),
        };
      }
  
      this.posts = updatedPosts;
      this.postsUpdated.next([...this.posts]); 
    });
  }
  
  

  deletePost(postId: string) {
    this.http.delete("http://localhost:3000/api/posts/" + postId).subscribe(() => {
      this.posts = this.posts.filter((post) => post.id !== postId);
      this.postsUpdated.next([...this.posts]);
      this.router.navigate(["/"]);
    });
  }
}
