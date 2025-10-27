import { Component, Input, Injector, OnInit } from '@angular/core';
import { ICreateKnowldege } from '../../create-account.helper';
import { Router } from '@angular/router';
import { BaseComponent } from 'src/app/modules/base.component';
import { KnowledgeService, Knowledge } from 'src/app/_fake/services/knowledge/knowledge.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-step6',
  templateUrl: './step6.component.html',
  styles: [`
    /* Fixed height for consistent card heights */
    .fixed-height-card {
      min-height: 180px;
      align-items: center;
    }

    /* Ensure proper spacing between cards */
    .notice + .notice {
      margin-top: 1.5rem;
    }

    /* Social share button styles */
    .social-share-btn {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      transition: all 0.2s ease;
      border: none;
    }

    .social-share-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .social-share-btn:active {
      transform: translateY(0);
    }

    .social-share-btn i {
      font-size: 20px !important;
      line-height: 1;
    }

    /* Ensure consistent sizing across all buttons */
    .social-share-btn.btn-primary,
    .social-share-btn.btn-dark,
    .social-share-btn.btn-info,
    .social-share-btn.btn-success {
      width: 50px;
      height: 50px;
      min-width: 50px;
      padding: 0;
    }
  `]
})
export class Step6Component extends BaseComponent implements OnInit {
  @Input() defaultValues: Partial<ICreateKnowldege>;

  // Share functionality properties
  publishedKnowledge: Knowledge | null = null;
  isSocialShareModalVisible: boolean = false;
  customShareMessage: string = "";
  linkCopied: boolean = false;

  constructor(
    injector: Injector,
    private router: Router,
    private knowledgeService: KnowledgeService,
    private translateService: TranslateService
  ) {
    super(injector);
    this.addTranslations();
  }

  private addTranslations() {
    // Add translation keys for share functionality
    const translations = {
      'en': {
        'SHARE_YOUR_KNOWLEDGE': 'Share Your Knowledge',
        'SHARE_KNOWLEDGE_DESCRIPTION': 'Spread the word and help others discover your valuable insights. Sharing your knowledge increases its reach and impact in the community.',
        'SHARE_NOW': 'Share Now',
        'KNOWLEDGE_SENT_FOR_REVIEW': 'Knowledge Sent for Review',
        'KNOWLEDGE_REVIEW_MESSAGE': 'Your knowledge has been successfully sent for manager review. You will be notified once the review is complete.',
        'COPY_LINK': 'Copy Link',
        'LINK_COPIED': 'Link Copied!'
      },
      'ar': {
        'SHARE_YOUR_KNOWLEDGE': 'شارك معرفتك',
        'SHARE_KNOWLEDGE_DESCRIPTION': 'انشر الكلمة وساعد الآخرين في اكتشاف رؤاك القيمة. مشاركة معرفتك تزيد من انتشارها وتأثيرها في المجتمع.',
        'SHARE_NOW': 'شارك الآن',
        'KNOWLEDGE_SENT_FOR_REVIEW': 'تم إرسال المعرفة للمراجعة',
        'KNOWLEDGE_REVIEW_MESSAGE': 'تم إرسال معرفتك بنجاح لمراجعة المدير. سيتم إشعارك بمجرد اكتمال المراجعة.',
        'COPY_LINK': 'نسخ الرابط',
        'LINK_COPIED': 'تم نسخ الرابط!'
      }
    };

    // Add translations for each language
    for (const [lang, trans] of Object.entries(translations)) {
      this.translateService?.setTranslation(lang, trans, true);
    }
  }

  ngOnInit(): void {
    // If knowledge is published, fetch its details
    if (this.defaultValues.publish_status === 'published' && this.defaultValues.knowledgeId) {
      this.loadKnowledgeDetails();
    }
  }

  private loadKnowledgeDetails(): void {
    if (this.defaultValues.knowledgeId) {
      this.knowledgeService.getKnowledgeById(this.defaultValues.knowledgeId).subscribe({
        next: (response) => {
          this.publishedKnowledge = response.data;
        },
        error: (error) => {
          console.error('Error fetching knowledge details:', error);
        }
      });
    }
  }

  navigateToStepper() {
    console.log('Navigating to stepper...');
    // Try with the full absolute path
    window.location.reload();
  }

  openSocialShareModal(): void {
    this.isSocialShareModalVisible = true;
    this.customShareMessage = this.getDefaultShareMessage();
    this.linkCopied = false;
  }

  closeSocialShareModal(): void {
    this.isSocialShareModalVisible = false;
  }

  getShareableLink(): string {
    if (!this.publishedKnowledge) return '';
    const knowledgeType = this.publishedKnowledge.type?.toLowerCase() || 'insight';
    const slug = this.publishedKnowledge.slug || '';
    return `https://knoldg.com/en/knowledge/${knowledgeType}/${slug}`;
  }

  getSocialShareTitle(): string {
    if (!this.publishedKnowledge) return 'Knowledge';
    const knowledgeType = this.publishedKnowledge.type ? this.publishedKnowledge.type.charAt(0).toUpperCase() + this.publishedKnowledge.type.slice(1) : 'Knowledge';
    const title = this.publishedKnowledge.title || 'Amazing Knowledge';
    return `${knowledgeType} - ${title}`;
  }

  getDefaultShareMessage(): string {
    if (!this.publishedKnowledge) return '';
    if (this.lang === 'ar') {
      return `اعتقدت أنك قد تستمتع بهذا على Knoldg.com: ${this.publishedKnowledge.type || 'معرفة'} - ${this.publishedKnowledge.title || 'تحقق من هذه المعرفة'}`;
    }
    return `Thought you might enjoy this on Knoldg.com: ${this.publishedKnowledge.type || 'Knowledge'} - ${this.publishedKnowledge.title || 'Check out this knowledge'}`;
  }

  shareToSocial(platform: string): void {
    const shareUrl = this.getSocialShareLinkWithCustomMessage(platform);
    window.open(shareUrl, '_blank', 'width=600,height=400');
    this.closeSocialShareModal();
  }

  getSocialShareLinkWithCustomMessage(platform: string): string {
    const shareUrl = this.getShareableLink();
    const message = this.customShareMessage || this.getDefaultShareMessage();
    const title = this.getSocialShareTitle();

    switch(platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(message)}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(shareUrl)}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(message)}`;
      case 'whatsapp':
        return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}%20${encodeURIComponent(shareUrl)}`;
      default:
        return '';
    }
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.linkCopied = true;
      setTimeout(() => {
        this.linkCopied = false;
      }, 3000);
    });
  }
} 