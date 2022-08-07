import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NewListComponent } from './pages/new-list/new-list.component';
import { NewTaskComponent } from './pages/new-task/new-task.component';
import { TaskviewComponent } from './pages/taskview/taskview.component';

const routes: Routes = [
  { path: '', redirectTo: 'lists', pathMatch:'prefix'},
  { path: 'new-list', component: NewListComponent },
  { path: 'lists', component: TaskviewComponent },
  { path: 'lists/:listId', component: TaskviewComponent },
  { path: 'lists/:listId/new-task', component: NewTaskComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
