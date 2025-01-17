import { useState, useEffect } from "react";
import Image from "next/image";
import AdminLayout from "@/components/AdminLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
  TableHead,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Pen, Trash, MoreHorizontal } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import BarLoader from "react-spinners/BarLoader";

const override = {
  display: "block",
  margin: "0 auto",
  borderColor: "white",
};

export default function Partenaires() {
  const [nom, setNom] = useState("");
  const [lien, setLien] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [partenaires, setPartenaires] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const fetchPartenaires = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/partners");
      if (!response.ok) {
        throw new Error("Failed to fetch partenaires");
      }
      const data = await response.json();
      console.log(data);
      setPartenaires(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedfile = e.target.files[0];
    setFile(selectedfile);

    if (selectedfile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedfile);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("name", nom);
    formData.append("website", lien);
    formData.append("description", desc);
    if (file) {
      formData.append("logo", file);
    }

    try {
      const url = editingId ? `/api/partners/${editingId}` : "/api/partners";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to submit the form");
      }

      await fetchPartenaires();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/partners?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete partenaire");
      }
      await fetchPartenaires();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (partenaire) => {
    setEditingId(partenaire._id);
    setNom(partenaire.metadata.name);
    setLien(partenaire.metadata.website);
    setDesc(partenaire.metadata.description);
    setPreview(getImage(partenaire._id));
  };

  useEffect(() => {
    fetchPartenaires();
  }, []);

  function getImage(id) {
    return `http://localhost:3000/api/partners/${id}`;
  }

  return (
    <AdminLayout>
      <div className="w-full p-4">
        <div className="flex justify-between">
          <h1 className="text-xl font-semibold">Nos partenaires</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Ajouter un partenaire</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau partenaire</DialogTitle>
                <DialogDescription>
                  Veuillez entrer les informations sur le partenaire.
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={handleSubmit}
                encType="multipart/form-data"
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="logo">Logo</Label>
                  <Input
                    type="file"
                    name="logo"
                    id="logo"
                    onChange={handleFileChange}
                  />
                  {preview && (
                    <div>
                      <p>Image Preview:</p>
                      <img
                        src={preview}
                        alt="Image preview"
                        style={{ width: "100px", height: "100" }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="id_nom">Nom</Label>
                  <Input
                    type="text"
                    id="id_nom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="id_lien">Site Web</Label>
                  <Input
                    type="text"
                    id="id_lien"
                    value={lien}
                    onChange={(e) => setLien(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="id_desc">Description</Label>
                  <Textarea
                    name="input_desc"
                    id="id_desc"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                  ></Textarea>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading
                        ? "Enregistrement..."
                        : editingId
                          ? "Mettre à jour"
                          : "Enregistrer"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Enregistrement réussi
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Le partenaire a été bien enregistrer
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <DialogClose asChild>
                          <AlertDialogAction
                            onClick={() => {
                              setFile(null);
                              setNom("");
                              setLien("");
                              setDesc("");
                              setPreview(null);
                            }}
                          >
                            Continuer
                          </AlertDialogAction>
                        </DialogClose>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialogContent>
                </AlertDialog>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="w-full mt-4">
          {isLoading ? (
            <BarLoader
              color={"#fff"}
              loading={isLoading}
              cssOverride={override}
              size={150}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          ) : error ? (
            <p>
              Une erreur s'est produite pendant le chargement des partenaires...
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Lien</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partenaires.map((partenaire, index) => (
                  <TableRow key={partenaire._id || index}>
                    <TableCell>
                      <Image
                        src={`${getImage(partenaire._id)}`}
                        style={{ objectFit: "contain" }}
                        alt={`logo de ${partenaire.metadata.name}`}
                        height={128}
                        width={128}
                      />
                    </TableCell>
                    <TableCell>{partenaire.metadata.name}</TableCell>
                    <TableCell>{partenaire.metadata.website}</TableCell>
                    <TableCell style={{ maxWidth: 300 }}>
                      {partenaire.metadata.description}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <MoreHorizontal />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56">
                            <DropdownMenuItem
                              onClick={() => handleEdit(partenaire)}
                            >
                              <DialogTrigger>
                                <div className="flex w-full items-center">
                                  <Pen className="mr-2 h-4 w-4" />
                                  <span>Editer</span>
                                </div>
                              </DialogTrigger>
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-red-500"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  <span>Supprimer</span>
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Suprimer!?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Vous êtes sûr de vouloir Supprimer?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(partenaire._id)}
                                  >
                                    Continuer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              Modifier les informations sur le partenaire
                            </DialogTitle>
                          </DialogHeader>

                          <form
                            onSubmit={handleSubmit}
                            encType="multipart/form-data"
                            className="flex flex-col gap-4"
                          >
                            <div className="flex flex-col gap-2">
                              <Label>Logo</Label>
                              <div className="flex items-center gap-2">
                                {preview ? (
                                  <Image
                                    src={preview}
                                    alt="logo preview"
                                    width={80}
                                    height={80}
                                  />
                                ) : (
                                  <Image
                                    src={`/file_uploads/${partenaire.fileName}`}
                                    alt={`logo of ${partenaire.name}`}
                                    width={80}
                                    height={80}
                                    className="bg-gray-200"
                                  />
                                )}
                                <Button asChild variant="outline">
                                  <Label htmlFor="change">
                                    Changer
                                    <Input
                                      type="file"
                                      name="fileUpload"
                                      id="change"
                                      onChange={handleFileChange}
                                      className="hidden"
                                    />
                                  </Label>
                                </Button>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Label htmlFor="id_nom">Nom</Label>
                              <Input
                                type="text"
                                id="id_nom"
                                value={nom}
                                onChange={(e) => setNom(e.target.value)}
                              />
                            </div>

                            <div className="flex flex-col gap-2">
                              <Label htmlFor="id_lien">Lien</Label>
                              <Input
                                type="text"
                                id="id_lien"
                                value={lien}
                                onChange={(e) => setLien(e.target.value)}
                              />
                            </div>

                            <div className="flex flex-col gap-2">
                              <Label htmlFor="id_desc">Descriptions</Label>
                              <Textarea
                                name="input_desc"
                                id="id_desc"
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                              ></Textarea>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button type="submit" disabled={isLoading}>
                                  Enregistrer
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Enregistrement réussi
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Le partenaire a été bien enregistrer
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <DialogClose asChild>
                                      <AlertDialogAction
                                        onClick={() => {
                                          setFile(null);
                                          setNom("");
                                          setLien("");
                                          setDesc("");
                                          setPreview(null);
                                        }}
                                      >
                                        Continuer
                                      </AlertDialogAction>
                                    </DialogClose>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialogContent>
                            </AlertDialog>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
