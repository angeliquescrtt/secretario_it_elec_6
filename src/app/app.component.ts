import { Component } from '@angular/core';


interface Post {
  id: number;
  title: any;
  content: any;
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'it_elec-6a';
  storedPosts:  Post[] = [];
  onPostAdded(post: any): void{
    this.storedPosts.push(post);
  }
}
