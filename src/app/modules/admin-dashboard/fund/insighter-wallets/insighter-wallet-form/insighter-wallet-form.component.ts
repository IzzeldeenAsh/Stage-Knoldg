import { Component, OnInit, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-insighter-wallet-form',
  templateUrl: './insighter-wallet-form.component.html',
  styleUrls: ['./insighter-wallet-form.component.scss']
})
export class InsighterWalletFormComponent extends BaseComponent implements OnInit {
  insighterId: number = 0;

  // Dummy data for now
  insighterData = {
    name: 'Izzeldeen Ashoor',
    email: 'izaldeen@gamil.com',
    role: 'Insighter',
    balance: 4500,
    profile_photo_url: 'https://preview.keenthemes.com/metronic8/demo27/assets/media/avatars/300-1.jpg'
  };

  constructor(
    injector: Injector,
    private route: ActivatedRoute,
    private router: Router
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.insighterId = +params['id'];
    });
  }

  goBack(): void {
    this.router.navigate(['/admin-dashboard/admin/fund/insighter-wallets']);
  }

  onPrint(): void {
    window.print();
  }

  onShareWhatsapp(): void {
    // TODO: Implement WhatsApp share
    this.showInfo('Info', 'WhatsApp share functionality coming soon');
  }

  onSendEmail(): void {
    // TODO: Implement email send
    this.showInfo('Info', 'Email send functionality coming soon');
  }
}
