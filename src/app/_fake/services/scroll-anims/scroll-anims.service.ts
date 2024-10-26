import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { Observable, map, catchError, finalize } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScrollAnimsService {

  constructor(private http: HttpClient) { 
    gsap.registerPlugin(ScrollTrigger);
  }

  // login(body:any): Observable<any> {
  //   const headers = new HttpHeaders({
  //     'Accept': 'application/json',
  //     'Accept-Language': 'ar'
  //   });
  
  //   return this.http.get<any>('http://api.4sighta.com/api/common/user/login',body ,{ headers }).pipe(
  //     map(res => res ? res : []),  // Ensure that the response is always an array or fallback to an empty array
  //   );
  // }

  public scrollAnimations() {
    // appearance
    const appearance = document.querySelectorAll(".mil-up");

    appearance.forEach((section) => {
      gsap.fromTo(
        section,
        {
          opacity: 0,
          y: 20,
          scale: 0.98,
          ease: 'sine',
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.4,
          scrollTrigger: {
            trigger: section,
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    // scale image
    const scaleImage = document.querySelectorAll(".mil-scale");

    scaleImage.forEach((section) => {
      const value1 = section.getAttribute('data-value-1') ?? '1'; // Fallback value
      const value2 = section.getAttribute('data-value-2') ?? '1'; // Fallback value

      gsap.fromTo(section, {
        ease: 'sine',
        scale: value1,
      }, {
        scale: value2,
        scrollTrigger: {
          trigger: section,
          scrub: true,
          toggleActions: 'play none none reverse',
        }
      });
    });

    // parallax
    const parallaxImage = document.querySelectorAll(".mil-parallax");

    if (window.innerWidth > 960) {
      parallaxImage.forEach((section) => {
        const value1 = section.getAttribute('data-value-1') ?? '0';
        const value2 = section.getAttribute('data-value-2') ?? '0';

        gsap.fromTo(section, {
          ease: 'sine',
          y: value1,
        }, {
          y: value2,
          scrollTrigger: {
            trigger: section,
            scrub: true,
            toggleActions: 'play none none reverse',
          }
        });
      });
    }

    // rotate
    const rotate = document.querySelectorAll(".mil-rotate");

    rotate.forEach((section) => {
      const htmlSection = section as HTMLElement; // Type casting
      const value = htmlSection.dataset.value ?? '0'; // Fallback to '0' if null
      gsap.fromTo(htmlSection, {
        ease: 'sine',
        rotate: 0,
      }, {
        rotate: value,
        scrollTrigger: {
          trigger: section,
          scrub: true,
          toggleActions: 'play none none reverse',
        }
      });
    });

    // back to top
    const btt = document.querySelector(".mil-back-to-top .mil-link ");
    const currentPage  =  document.querySelector(".mil-current-page"); 
    
    if (currentPage) {
      gsap.set(currentPage, {
        x: -30,
        opacity: 0,
      });

      gsap.to(currentPage, {
        x: 0,
        opacity: 1,
        ease: 'sine',
        scrollTrigger: {
          trigger: "body",
          start: "top -40%",
          end: "top -40%",
          toggleActions: "play none reverse none"
        }
      });
    }

    if (btt) {
      gsap.set(btt, {
        x: -30,
        opacity: 0,
      });

      gsap.to(btt, {
        x: 0,
        opacity: 1,
        ease: 'sine',
        scrollTrigger: {
          trigger: "body",
          start: "top -40%",
          end: "top -40%",
          toggleActions: "play none reverse none"
        }
      });
    }

    
  }
}