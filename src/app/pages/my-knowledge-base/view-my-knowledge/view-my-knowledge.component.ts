import { Component, Injector, OnInit } from "@angular/core";
import { ActivatedRoute, Params } from "@angular/router";
import { forkJoin } from "rxjs";
import { Breadcrumb } from "src/app/_fake/models/breadcrumb.model";
import { IForsightaProfile } from "src/app/_fake/models/profile.interface";
import { DocumentListResponse } from "src/app/_fake/services/add-insight-steps/add-insight-steps.service";
import { ProfileService } from "src/app/_fake/services/get-profile/get-profile.service";
import {
  Knowledge,
  KnowledgeService,
} from "src/app/_fake/services/knowledge/knowledge.service";
import { BaseComponent } from "src/app/modules/base.component";

@Component({
  selector: "app-view-my-knowledge",
  templateUrl: "./view-my-knowledge.component.html",
  styleUrl: "./view-my-knowledge.component.scss",
})
export class ViewMyKnowledgeComponent extends BaseComponent implements OnInit {
  breadcrumbs: Breadcrumb[] = [];
  knowledgeId: string;
  knowledge: Knowledge;
  documents: DocumentListResponse;
  isLoading: boolean = false;
  profile:IForsightaProfile;
  constructor(
    injector: Injector,
    private knowledgeService: KnowledgeService,
    private route: ActivatedRoute,
    private _getProfile:ProfileService
  ) {
    super(injector);
  }

  ngOnInit() {
    this._getProfile.getProfile().subscribe((profile) => {
      this.profile = profile;
    });
    this.route.data.subscribe((data) => {
      if (data["breadcrumb"]) {
        this.breadcrumbs = data["breadcrumb"];
      }
    });
    const paramsSubscription = this.route.params.subscribe((params: Params) => {
      this.knowledgeId = params["id"];
      if (this.knowledgeId) {
        this.loadKnowledgeData();
      }
    });
    this.unsubscribe.push(paramsSubscription);
  }

  private loadKnowledgeData(): void {
    this.isLoading = true;
    const knowledgeSubscription = forkJoin({
      knowledge: this.knowledgeService.getKnowledgeById(
        Number(this.knowledgeId)
      ),
      documents: this.knowledgeService.getListDocumentsInfo(
        Number(this.knowledgeId)
      ),
    }).subscribe({
      next: (response) => {
        this.knowledge = response.knowledge.data;
        this.documents = response.documents;
        this.isLoading = false;
      },
      error: (error) => {
        console.error("Error loading knowledge data:", error);
        this.isLoading = false;
      },
    });
    this.unsubscribe.push(knowledgeSubscription);
  }
}
