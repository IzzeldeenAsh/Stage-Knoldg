import { Component, OnInit, AfterViewInit } from '@angular/core';
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';

@Component({
  selector: 'app-related-knowledges',
  templateUrl: './related-knowledges.component.html',
  styleUrls: ['./related-knowledges.component.scss']
})
export class RelatedKnowledgesComponent implements OnInit, AfterViewInit {
  private swiper: Swiper;

  constructor() { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.initSwiper();
  }

  private initSwiper(): void {
    this.swiper = new Swiper('.swiper-container', {
      modules: [Navigation, Pagination],
      slidesPerView: 'auto',
      centeredSlides: true,
      spaceBetween: 30,
      loop: true,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      breakpoints: {
        320: {
          slidesPerView: 1,
          spaceBetween: 20
        },
        768: {
          slidesPerView: 2,
          spaceBetween: 30
        },
        1024: {
          slidesPerView: 3,
          spaceBetween: 30
        }
      }
    });
  }
}
