import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { List } from 'src/app/models/list.model';
import { TaskService } from 'src/app/task.service';
import { Task } from 'src/app/models/task-model';

@Component({
  selector: 'app-taskview',
  templateUrl: './taskview.component.html',
  styleUrls: ['./taskview.component.scss']
})
export class TaskviewComponent implements OnInit {

  lists!: any;
  tasks!: any;
 
  selectedListId!: string;

  constructor(private taskService: TaskService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.route.params.subscribe(
      (params: Params) => {
        if (params['listId']) {
        this.selectedListId = params['listId'];
        this.taskService.getTasks(params['listId']).subscribe((tasks: Task) => {
          this.tasks = tasks;
        })
        } else {
          this.tasks = undefined;
        }
      }
    )
    this.taskService.getLists().subscribe((lists: List) => {
      this.lists = lists;
    })

  }

  onTaskClick(task: Task) {
    /// we want to set the task to complete
    this.taskService.complete(task).subscribe(() => {
      // the task has been set to completed successfully
      console.log("completed successfully!");
      task.completed = !task.completed;
    })
  }

  onDeleteListClick(){
    this.taskService.deleteList(this.selectedListId).subscribe((res:any) => {
      this.router.navigate(['/lists']);
      console.log(res);
      
    })

  }
  onDeleteTaskClick(id: string){
    this.taskService.deleteTask(this.selectedListId, id).subscribe((res:any) => {
    this.tasks=this.tasks.filter((val: { _id: string; }) => val._id !== id);
     console.log(res);
    })

  }

}
