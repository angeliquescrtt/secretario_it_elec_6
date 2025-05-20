import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { Post } from "../post.model";
import { PostsService } from "../posts.service";
import { PageEvent } from '@angular/material/paginator';
import { AuthService } from "src/app/authentication/auth.service";

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css'],
})
export class PostListComponent implements OnInit, OnDestroy {

  totalposts = 0;
  postperpage = 2;
  currentpage = 1;
  pageSizeOption = [1, 2, 5, 10];
  Loading = false;
  posts: Post[] = [];
  filteredPosts: Post[] = []; // For search

  userIsAuthenticated = false;
  userId: string | null = null;
  userEmail: string | null = null;

  newComments: { [postId: string]: string } = {};

  editedCommentId: string | null = null;
  editedCommentText: string = '';

  commentVisible: { [postId: string]: boolean } = {};
  showReactors: { [postId: string]: boolean } = {};

  sortOrder: 'asc' | 'desc' = 'asc';

  searchTerm: string = ''; // Search input

  private postsSub!: Subscription;
  private authStatusSub!: Subscription;

  constructor(
    public postsService: PostsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.Loading = true;
    this.userId = this.authService.getUserId();
    this.userEmail = this.authService.getUserEmail();
    this.userIsAuthenticated = this.authService.getIsAuth();

    this.fetchPosts();

    this.postsSub = this.postsService.getPostUpdatedListener()
      .subscribe((postData: { posts: Post[], postCount: number }) => {
        this.posts = postData.posts.map(post => {
          const userReacted = post.reactions?.some(r => r.userId === this.userId);
          return {
            ...post,
            timestamp: Date.now(),
            reacted: userReacted,
            reactionCount: post.reactions?.length || 0,
            comments: post.comments || []
          };
        });

        this.totalposts = postData.postCount;
        this.Loading = false;

        this.posts.forEach(post => {
          if (post.id) {
            this.postsService.getComments(post.id).subscribe({
              next: (res) => {
                post.comments = res.comments;
              },
              error: (err) => {
                console.error(`Fetching comments for post ${post.id} failed:`, err);
                post.comments = [];
              }
            });
          }
        });

        this.sortPosts();
        this.applySearch(); // Apply search after loading
      });

    this.authStatusSub = this.authService.getAuthStatusListener()
      .subscribe(isAuthenticated => {
        this.userIsAuthenticated = isAuthenticated;
        this.userId = this.authService.getUserId();
        this.userEmail = this.authService.getUserEmail();
      });
  }

  fetchPosts(): void {
    this.postsService.getPosts(this.postperpage, this.currentpage);
  }

  onChangedPage(pageData: PageEvent): void {
    this.Loading = true;
    this.currentpage = pageData.pageIndex + 1;
    this.postperpage = pageData.pageSize;
    this.fetchPosts();
  }

  onDelete(postId: string): void {
    this.Loading = true;
    this.postsService.deletePost(postId)
      .subscribe({
        next: () => this.fetchPosts(),
        error: (error) => {
          console.error('Error deleting post:', error);
          this.Loading = false;
        }
      });
  }

  addComment(postId: string): void {
    const commentText = this.newComments[postId]?.trim();
    if (!commentText) return;

    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    if (!post.comments) post.comments = [];

    const tempId = 'temp-' + Date.now();

    post.comments.push({
      id: tempId,
      comment: commentText,
      userId: this.userId,
      userEmail: this.userEmail
    });

    this.newComments[postId] = '';

    this.postsService.addComment(postId, commentText)
      .subscribe({
        next: (response) => {
          post.comments = response.comments;
        },
        error: (error) => {
          console.error('Error adding comment:', error);
          this.newComments[postId] = commentText;
          post.comments = post.comments.filter(c => c.id !== tempId);
        }
      });
  }

  editComment(postId: string, comment: any): void {
    if (!comment.id) {
      console.error('Cannot update comment: Missing comment ID.');
      return;
    }
    this.editedCommentId = comment.id;
    this.editedCommentText = comment.comment;
  }

  saveEditedComment(postId: string, commentId: string): void {
    if (!this.editedCommentText.trim()) return;

    this.postsService.updateComment(postId, commentId, this.editedCommentText.trim())
      .subscribe({
        next: () => {
          const post = this.posts.find(p => p.id === postId);
          if (post && post.comments) {
            const commentToUpdate = post.comments.find(c => c.id === commentId);
            if (commentToUpdate) {
              commentToUpdate.comment = this.editedCommentText.trim();
            }
          }
          this.cancelEdit();
        },
        error: (err) => {
          console.error("Failed to update comment:", err);
        }
      });
  }

  cancelEdit(): void {
    this.editedCommentId = null;
    this.editedCommentText = '';
  }

  deleteComment(postId: string, commentId: string): void {
    if (!commentId) return;

    if (confirm('Are you sure you want to delete this comment?')) {
      this.postsService.deleteComment(postId, commentId)
        .subscribe({
          next: () => {
            const post = this.posts.find(p => p.id === postId);
            if (post && post.comments) {
              post.comments = post.comments.filter(comment => comment.id !== commentId);
            }
          },
          error: (err) => {
            console.error("Failed to delete comment:", err);
          }
        });
    }
  }

  toggleComment(postId: string) {
    this.commentVisible[postId] = !this.commentVisible[postId];
  }

  toggleReaction(post: any) {
    if (!this.userId) {
      console.error("User ID is not set!");
      return;
    }

    if (post.reacted) {
      this.postsService.removeReaction(post.id, this.userId).subscribe({
        next: () => {
          post.reacted = false;
          post.reactionCount = Math.max(0, post.reactionCount - 1);
        },
        error: (err) => console.error('Failed to remove reaction:', err),
      });
    } else {
      this.postsService.addReaction(post.id).subscribe({
        next: (response) => {
          post.reacted = true;
          post.reactions = response.reactions;
          post.reactionCount = response.reactions.length;
        },
        error: (err) => console.error('Failed to add reaction:', err),
      });
    }
  }

  toggleShowReactors(postId: string) {
    this.showReactors[postId] = !this.showReactors[postId];
  }

  sortPosts(): void {
    this.posts.sort((a, b) => {
      const titleA = a.title?.toLowerCase() || '';
      const titleB = b.title?.toLowerCase() || '';
      return this.sortOrder === 'asc'
        ? titleA.localeCompare(titleB)
        : titleB.localeCompare(titleA);
    });
  }

  onChangeSortOrder(order: 'asc' | 'desc') {
    this.sortOrder = order;
    this.sortPosts();
    this.applySearch(); // Re-apply search after sorting
  }

  onSearch(term: string): void {
    this.searchTerm = term.toLowerCase();
    this.applySearch();
  }

  applySearch(): void {
    if (!this.searchTerm) {
      this.filteredPosts = [...this.posts];
    } else {
      this.filteredPosts = this.posts.filter(post =>
        post.title?.toLowerCase().includes(this.searchTerm)
      );
    }
  }

  ngOnDestroy(): void {
    this.postsSub?.unsubscribe();
    this.authStatusSub?.unsubscribe();
  }
}
