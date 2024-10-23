export class UserModel {
    _id?: string;
    TypeDNI?: string;
    DNI?: string;
    FirstName?: string;
    LastName?: string;
    Email?: string;
    Password?: string;
    Role?: string;
  
    constructor(init?: Partial<UserModel>) {
      Object.assign(this, init); // Asigna los valores opcionalmente.
    }
  }