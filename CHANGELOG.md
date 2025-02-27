
## 1.1.8 (2023-03-10)

### Fixed (9 changes)

- [Fixed a bug in handling UI load errors.](nomad-lab/nomad-FAIR@bc01f359fbd55048fff0c7213ba42ae53451add3) ([merge request](nomad-lab/nomad-FAIR!1143))
- [Add parsers](nomad-lab/nomad-FAIR@b1c177f75cd72dfabaea6137d93375357857b3a6) ([merge request](nomad-lab/nomad-FAIR!1136))
- [Fixed the backend test batch to actually show the coverage.](nomad-lab/nomad-FAIR@532eba1e0ae44f56a93a9580b11ac44d02fa49e5) ([merge request](nomad-lab/nomad-FAIR!1131))
- [Check existance of `m_proxy_value` for references.](nomad-lab/nomad-FAIR@79040365fd370257941f663b92a40984da3bd67b) ([merge request](nomad-lab/nomad-FAIR!1123))
- [Minor fix workflow visualizer](nomad-lab/nomad-FAIR@1b0154166bf24b17a701e91564140e1fdfaf0d7f) ([merge request](nomad-lab/nomad-FAIR!1121))
- [ability to reference to the other uploads properly](nomad-lab/nomad-FAIR@8befc8efe92218aa63a63c562ac8057de54e5ba2) ([merge request](nomad-lab/nomad-FAIR!1070))
- [Added the staging url](nomad-lab/nomad-FAIR@5a0b31a7cff12106a28f0fc02bba7fda764d4708) ([merge request](nomad-lab/nomad-FAIR!1086))
- [Workflow fix](nomad-lab/nomad-FAIR@75170b392d779cf9a27880fd83433c3d47a85b37) ([merge request](nomad-lab/nomad-FAIR!1113))
- [Fixed the availability of the beta/test snack in the UI.](nomad-lab/nomad-FAIR@a3f29510858bf6ba6056f1c52af177e70d24eacc) ([merge request](nomad-lab/nomad-FAIR!1134))

### Added (10 changes)

- [Added additional html sanitization before using html on the UI.](nomad-lab/nomad-FAIR@1f00ee39dd664090a3c0467c81dc7adb48c32e39) ([merge request](nomad-lab/nomad-FAIR!1140))
- [Added Green's functions into electronic properties.](nomad-lab/nomad-FAIR@105c975e35c2a9d179a007a016263e2db6b89448) ([merge request](nomad-lab/nomad-FAIR!1065))
- [Appending similar quantities (column names) to the appropriate subsection in Tabular_Parser](nomad-lab/nomad-FAIR@46a3bb8ca9a8798d9b37fe4ad242b7b459c18551) ([merge request](nomad-lab/nomad-FAIR!1088))
- [Added Feature for Creating Workflow in ELN](nomad-lab/nomad-FAIR@09e6c80bde3519d11cb42f85139adf1febf5c484) ([merge request](nomad-lab/nomad-FAIR!1101))
- [Added hyperlink to entry in scatter plot widget and hover details](nomad-lab/nomad-FAIR@6a8e55f9dee79aed241273d82aeb9d58016ee82d) ([merge request](nomad-lab/nomad-FAIR!1126))
- [Added an HDF5Reference type to the metainfo.](nomad-lab/nomad-FAIR@26de816576d73d05d4a2db79433abc6c4db610f4) ([merge request](nomad-lab/nomad-FAIR!1040))
- [Added better description of our code documentation practices.](nomad-lab/nomad-FAIR@eab55e797c21dcc8a2df68b451fb6bbc5f08fe60) ([merge request](nomad-lab/nomad-FAIR!1129))
- [Added properties eln annotation to customize the appearance and the permissions](nomad-lab/nomad-FAIR@87debf8136b58bb16d57ec8e7a492797504e60b1) ([merge request](nomad-lab/nomad-FAIR!1093))
- [Adding ReferenceEditQuantity Field to LabfolderProject allowing for further customization](nomad-lab/nomad-FAIR@c1c8adf0b1d8316e7cfb7bd7e505b46a202ca819) ([merge request](nomad-lab/nomad-FAIR!1025))
- [Added the possibility to define plots in the custom schemas that use scalar...](nomad-lab/nomad-FAIR@aba802ce34061d27c7bdf9863d30c0aa6605fd0f) ([merge request](nomad-lab/nomad-FAIR!1110))

### Changed (3 changes)

- [Changed the branding of the app and docs.](nomad-lab/nomad-FAIR@c8de145b9f95b9ef44fb511410256be17f375e0f) ([merge request](nomad-lab/nomad-FAIR!1135))
- [Upgraded nomad-lab to Python 3.9 and bumped a few dependency version.](nomad-lab/nomad-FAIR@5cb6d4a46c5ac6c4809e66cc288dee32a68721de) ([merge request](nomad-lab/nomad-FAIR!1125))
- [Changed the config to use Pydantic models for UI aspects.](nomad-lab/nomad-FAIR@de1ed6ffb8db168f6f7ae4f6e9addd59879f552f) ([merge request](nomad-lab/nomad-FAIR!1104))

## 1.1.7 (2023-02-20)

### Added (18 changes)

- [Added a config switch to enable disable north tools.](nomad-lab/nomad-FAIR@37d9b6db1e8044ae28476488e8c3ae1896e149ad) ([merge request](nomad-lab/nomad-FAIR!1099))
- [Refactor NORTH and Jupyterhub deployment. Add a new north API endpoint. Mount...](nomad-lab/nomad-FAIR@b0e28fa7fd3f47fcd538f33bd84bad659ee6549a) ([merge request](nomad-lab/nomad-FAIR!996))
- [Added categories to create entry build-in schemas.](nomad-lab/nomad-FAIR@6a2b96f58c29a09364523c1d140c13c6a9cf24b0) ([merge request](nomad-lab/nomad-FAIR!1085))
- [Added support for slice notation when choosing axis quantities in the plot annotation.](nomad-lab/nomad-FAIR@1fedce5e2a310fde2d304aa38262cbc79adeb289) ([merge request](nomad-lab/nomad-FAIR!1073))
- [New workflow visualizer](nomad-lab/nomad-FAIR@e02bfb3cc5fdcc5eb3beda6910a204e84fde7f5f) ([merge request](nomad-lab/nomad-FAIR!957))
- [Added pagination feature for long sections in the archive browser.](nomad-lab/nomad-FAIR@b13839fdaa1bdd111b2cd32e35a7887ce65db816) ([merge request](nomad-lab/nomad-FAIR!1081))
- [Added categories to the example uploads dialog.](nomad-lab/nomad-FAIR@994e272b478682f25fbdc5b8748ef09764a3ac8f) ([merge request](nomad-lab/nomad-FAIR!1080))
- [Added a new 3D structure viewer based on NGL.](nomad-lab/nomad-FAIR@91e8cd67247b5881b842df14014929098abce0df) ([merge request](nomad-lab/nomad-FAIR!776))
- [Dialog to create entry](nomad-lab/nomad-FAIR@5602071ffb659700360983e2ca7b27105de391b9) ([merge request](nomad-lab/nomad-FAIR!1032))
- [Added ELN Base Sections](nomad-lab/nomad-FAIR@4895124d43de7f3fe57b5c97281e3e86676cab4a) ([merge request](nomad-lab/nomad-FAIR!1037))
- [Ability to create and modify child classes from referenceEditQuantity](nomad-lab/nomad-FAIR@70ec0c443ea2cbf2481c162215283981b714b0b5) ([merge request](nomad-lab/nomad-FAIR!1019))
- [Added possibility for changing the page title to distinguish OASIS installations.](nomad-lab/nomad-FAIR@3604c83813251df4ec9c7daee021ba98cb7baca3) ([merge request](nomad-lab/nomad-FAIR!1056))
- [Added automatic push of develop to github.](nomad-lab/nomad-FAIR@e806087e77f8c6bcbeea9e42c218d0b377be3c6e) ([merge request](nomad-lab/nomad-FAIR!1047))
- [Added a to_ase function to simulation system Atoms section.](nomad-lab/nomad-FAIR@f97425cc835a08f4809a676af246c8ad8e2ea54f) ([merge request](nomad-lab/nomad-FAIR!1027))
- [Added a automatically generated changelog to our git.](nomad-lab/nomad-FAIR@fe795eff97145e0e28d61ca840cbb3069217d24a) ([merge request](nomad-lab/nomad-FAIR!1016))
- [Added a glossary to the documentation.](nomad-lab/nomad-FAIR@aa42834ed51b3d231a8edc58b00ea1f2dddc21f5) ([merge request](nomad-lab/nomad-FAIR!1024))
- [Added dropdown list to select from sections.](nomad-lab/nomad-FAIR@a332abed1318f60078463e2ee71ae68b2086ef1a) ([merge request](nomad-lab/nomad-FAIR!992))
- [Implement extended matching of h5 files.](nomad-lab/nomad-FAIR@96372aa26a0675a0bbae99b8e5059f5e0f1a5f3a) ([merge request](nomad-lab/nomad-FAIR!1023))

### Fixed (18 changes)

- [Fixed wrong property inheritance base section order in UI metainfo.](nomad-lab/nomad-FAIR@9cbd6d9c37d21f06cf9fc3f5d9fbde746d7873b3) ([merge request](nomad-lab/nomad-FAIR!1098))
- [Fixed the build-in schema entry create to use the right definitions.](nomad-lab/nomad-FAIR@8db7bb1be8ab502f4aef178107f50d27297123a2) ([merge request](nomad-lab/nomad-FAIR!1095))
- [Fixed direct navigation of reference edit quantity by disabling it.](nomad-lab/nomad-FAIR@b6ba106989192407954d7846f13abfe13fde431d) ([merge request](nomad-lab/nomad-FAIR!1095))
- [Fixed bi-directional referencing in ELNs.](nomad-lab/nomad-FAIR@b5f8c7ac5f120943f5c235e3ee216424b26f0188) ([merge request](nomad-lab/nomad-FAIR!1095))
- [Resolve "quickfix: typo in scripts/build_sdist.sh"](nomad-lab/nomad-FAIR@0abcb2a53011529d628074203e4b6a67a5fbdf25) ([merge request](nomad-lab/nomad-FAIR!1090))
- [Fixed incorrect URL reported in the API call dialogs.](nomad-lab/nomad-FAIR@1f58dd2f3271c95829867933255bbb11c2540e61) ([merge request](nomad-lab/nomad-FAIR!1089))
- [Resolve the reference to a data defined together the schema in the same file](nomad-lab/nomad-FAIR@94a58aeaf49970b8bc9f8b1ef9605b790e125d31) ([merge request](nomad-lab/nomad-FAIR!1079))
- [ability to reference all with m_def not only data](nomad-lab/nomad-FAIR@d56a3645ed3515a2e63231d93ca013b4b6be3316) ([merge request](nomad-lab/nomad-FAIR!1079))
- [only fetch those entries which are processed](nomad-lab/nomad-FAIR@029e5ead244382330856fc541c4ad3c9d5d2e3c2) ([merge request](nomad-lab/nomad-FAIR!1079))
- [normalize path in url](nomad-lab/nomad-FAIR@d6fbcec4bc58b20910ea283dd3c6c1b741866b9d) ([merge request](nomad-lab/nomad-FAIR!1079))
- [URLEditQuantity is added as a string eln_component to annotations](nomad-lab/nomad-FAIR@a5a916b32358bfa4648ce7899e5dd0cf59186a40) ([merge request](nomad-lab/nomad-FAIR!1062))
- [Fixed issues with the developers setup of nomad.](nomad-lab/nomad-FAIR@d76fc7e061fb6a1662cfa13da6519dde51345ffa) ([merge request](nomad-lab/nomad-FAIR!1064))
- [Fixed endless recursion in metainfo browser.](nomad-lab/nomad-FAIR@1443063a8b3a8df36975204c12d23ba51b9962e2) ([merge request](nomad-lab/nomad-FAIR!1059))
- [Fixed the README batches and changed pipeline to push tags to github.](nomad-lab/nomad-FAIR@8c42e102387b2d0c5f0a55fd368b266306b705f1) ([merge request](nomad-lab/nomad-FAIR!1057))
- [Fixed issue with optimade filter menu performing premature API calls.](nomad-lab/nomad-FAIR@7c4ad789591ce6a30cb6236825798e440711ce21) ([merge request](nomad-lab/nomad-FAIR!1048))
- [Fixed generation of duplicated subsections on updating an entry that triggers tabular parser](nomad-lab/nomad-FAIR@e91176fe2a197f9d8450e29dc8b599f669ecad1d) ([merge request](nomad-lab/nomad-FAIR!1033))
- [Fix the select feature of the Datatable component](nomad-lab/nomad-FAIR@8fd52ed7bccc14c13c6c83d90e3a931df3cf9d25) ([merge request](nomad-lab/nomad-FAIR!1060))
- [Datafile quantity containing `tabular_parser` annotation can be referenced](nomad-lab/nomad-FAIR@8ad191bf7f37b9c1286200127f6f5b2f0cf3701a) ([merge request](nomad-lab/nomad-FAIR!1017))

### Changed (2 changes)

- [Small UX changes to the upload interface.](nomad-lab/nomad-FAIR@5e18b0e12d4ce4d608a5cd68efbeb02ee2d51f04) ([merge request](nomad-lab/nomad-FAIR!1085))
- [Refactored the overview UI code to optimise loading performance.](nomad-lab/nomad-FAIR@161051655e8b9406197247ed943e027fdd13771b) ([merge request](nomad-lab/nomad-FAIR!1075))

### Feature (1 change)

- [Adds an ELN schema that allows to create entries that clone data from a labfolder project.](nomad-lab/nomad-FAIR@166a8aaa65f63bf368453365689e1dab577fc94d) ([merge request](nomad-lab/nomad-FAIR!948))

## 1.1.6 (2022-12-23)

### Fixed (1 change)

- [Fixed failing plot annotation valiation.](nomad-lab/nomad-FAIR@3cd5d0635566d9882e1c44cd922e113dfbeb1292) ([merge request](nomad-lab/nomad-FAIR!1005))

### Feature (1 change)

- [Added a way to define formal models for metainfo annotations.](nomad-lab/nomad-FAIR@6a84b55e17dd5cd41cb5ba571f2451d528dbe6a0) ([merge request](nomad-lab/nomad-FAIR!990))

### Added (1 change)

- [Replaced config object with pydantic models.](nomad-lab/nomad-FAIR@b9c1e023d95d14fd337b98a7ac895f505d4715a9) ([merge request](nomad-lab/nomad-FAIR!981))
