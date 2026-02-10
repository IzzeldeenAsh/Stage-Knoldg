## **Badge Design**

✅ **Insighter Badge**

```
badge badge-light-success
```

✅ **Company / Company Insighter Role Badge**

```
badge badge-light-info
```

---

✅ **Main Color Used In the App**

```
text-info or bg-light-info ... -info thing.
```

## **⚠️ Error Handling**

- All errors are displayed using **toaster**

```
We extend KNOLDG-APP/src/app/modules/base.component.ts
Which has   showInfo(summary:string ='Info',detail: string='Info' ) {
    this.toastService.info(detail, summary);
  }

  showWarn(summary:string ='Warning',detail: string='Warning' ) {
    this.toastService.warning(detail, summary);
  }

  showSuccess(summary:string ='Success',detail: string='Success' ) {
    this.toastService.success(detail, summary);
  }

  showError(summary:string ='Error',detail: string='Error' ,life:number=5000) {
    this.toastService.warning(detail, summary, life);
  }

Which also has lang:string that can be 'en' or 'ar' so we know the current locale
```

- **API error response format** 👇

```
{
  "message": "Document language mismatch",
  "errors": {
    "file": [
      "Document language mismatch"
    ]
  }
}
```

- **Error handle method**👇

```
  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          this.showError(
            this.lang === "ar" ? "حدث خطأ" : "An error occurred",
            messages.join(", ")
          );
        }
      }
    } else {
      this.showError(
        this.lang === "ar" ? "حدث خطأ" : "An error occurred",
        this.lang === "ar" ? "حدث خطأ" : "An unexpected error occurred."
      );
    }
  }
} 
```

---

## **🌐 API Setup**

---

### **📩 Default Headers for Requests**

```

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {
    this.translationService.onLanguageChange().subscribe(lang => {
      this.currentLang = lang || 'en';;
    });
  }
{
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Accept-Language':  this.currentLang,
  'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
}
```

---

## **🎨 Styling Libraries**

✅ PrimeNg

✅ Metronic

✅ Bootstrap

**Preferences:**

- Simple, elegant, and clean design (similar to **Vercel** website).
- No shadows.
- Light gray borders
- We can use metronic icons and themes

---