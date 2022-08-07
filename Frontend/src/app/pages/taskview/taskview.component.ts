import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
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
 
  constructor(private taskService: TaskService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.params.subscribe(
      (params: Params) => {
        console.log(params);
        this.taskService.getTasks(params['listId']).subscribe((tasks: Task) => {
          this.tasks = tasks;
        })
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
}
