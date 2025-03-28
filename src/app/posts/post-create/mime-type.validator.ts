import { AbstractControl } from '@angular/forms';  
import { Observable, Observer, of } from 'rxjs';

export const mimetype = (control: AbstractControl): Promise<{[key: string]: any} | null> | 
Observable<{[key: string]: any} | null> => {  

  if(typeof(control.value)== 'string'){  
    return of(null);  
  } 

  const file = control.value as File;
  if (!file) {
    return new Observable(observer => {
      observer.next(null);
      observer.complete();
    });
  }

  const filereader = new FileReader(); 

  return new Observable((observer: Observer<{ [key: string]: any } | null>) => {  
    filereader.addEventListener("loadend", () => {  
      const arr = new Uint8Array(filereader.result as ArrayBuffer).subarray(0, 4);
      let header = "";  

      for (let i = 0; i < arr.length; i++) {  
        header += arr[i].toString(16);
      }  

      let isValid = false;  
      switch (header) {  
        case "89504e47":
        case "ffd8ffe0":
        case "ffd8ffe1":
        case "ffd8ffe2":
        case "ffd8ffe3":
        case "ffd8ffe8":
          isValid = true;  
          break;  
        default:  
          isValid = false;  
          break;  
      }  

      observer.next(isValid ? null : { invalidMimeType: true });
      observer.complete();          
    });  

    filereader.readAsArrayBuffer(file);  
  });   
};
